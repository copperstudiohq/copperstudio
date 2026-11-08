import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Build a self-contained CloudFormation template without storing generated copies of the handler. */
export function buildTemplate(handlerCode) {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Copperstudio shared aggregate website visit counter',
    Resources: {
      VisitsTable: {
        Type: 'AWS::DynamoDB::Table',
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [{ AttributeName: 'site', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'site', KeyType: 'HASH' }],
          OnDemandThroughput: { MaxReadRequestUnits: 20, MaxWriteRequestUnits: 20 },
          Tags: [{ Key: 'Project', Value: 'Copperstudio' }],
        },
      },
      VisitsLogs: {
        Type: 'AWS::Logs::LogGroup',
        Properties: { LogGroupName: '/aws/lambda/copperstudio-visit-counter', RetentionInDays: 7 },
      },
      VisitsRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }],
          },
          Policies: [{
            PolicyName: 'VisitCounterOnly',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow', Action: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
                  Resource: { 'Fn::GetAtt': ['VisitsTable', 'Arn'] },
                  Condition: { 'ForAllValues:StringEquals': { 'dynamodb:LeadingKeys': ['copperstudio.nl'] } },
                },
                {
                  Effect: 'Allow', Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: { 'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/copperstudio-visit-counter:*' },
                },
              ],
            },
          }],
        },
      },
      VisitsFunction: {
        Type: 'AWS::Lambda::Function',
        DependsOn: 'VisitsLogs',
        Properties: {
          FunctionName: 'copperstudio-visit-counter',
          Description: 'Read and increment the aggregate Copperstudio visit count',
          Runtime: 'nodejs24.x', Handler: 'index.handler', Architectures: ['arm64'],
          MemorySize: 128, Timeout: 5, ReservedConcurrentExecutions: 2,
          Role: { 'Fn::GetAtt': ['VisitsRole', 'Arn'] },
          Environment: { Variables: { VISITS_TABLE: { Ref: 'VisitsTable' } } },
          Code: { ZipFile: handlerCode },
          Tags: [{ Key: 'Project', Value: 'Copperstudio' }],
        },
      },
      VisitsUrl: {
        Type: 'AWS::Lambda::Url',
        Properties: {
          TargetFunctionArn: { 'Fn::GetAtt': ['VisitsFunction', 'Arn'] },
          AuthType: 'NONE',
          Cors: {
            AllowOrigins: ['https://copperstudio.nl', 'https://www.copperstudio.nl'],
            AllowMethods: ['GET', 'POST'], MaxAge: 3600,
          },
        },
      },
      PublicUrlPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { Ref: 'VisitsFunction' }, Principal: '*',
          Action: 'lambda:InvokeFunctionUrl', FunctionUrlAuthType: 'NONE',
        },
      },
      PublicUrlOnlyInvokePermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { Ref: 'VisitsFunction' }, Principal: '*',
          Action: 'lambda:InvokeFunction', InvokedViaFunctionUrl: true,
        },
      },
    },
    Outputs: {
      CounterUrl: { Description: 'Public aggregate counter endpoint', Value: { 'Fn::GetAtt': ['VisitsUrl', 'FunctionUrl'] } },
      TableName: { Description: 'Retained aggregate visit count table', Value: { Ref: 'VisitsTable' } },
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const destination = process.argv[2];
  if (!destination) throw new Error('Usage: node infra/visit-counter/template.mjs <output-file.json>');
  const code = await readFile(new URL('./handler.cjs', import.meta.url), 'utf8');
  await mkdir(dirname(resolve(destination)), { recursive: true });
  await writeFile(destination, JSON.stringify(buildTemplate(code), null, 2) + '\n');
  console.log(`Wrote visit counter template to ${destination}`);
}
