import test from 'node:test';
import assert from 'node:assert/strict';
import {createOctoChat,replyAsOcto} from '../lib/octo-chat.mjs';

test('guard accuracy questions receive aiming advice rather than coin-collection advice',()=>{
  for(const question of ['Can soldiers miss shots in Creek Watch?','How accurate are guards in Mosswake Creek?']){
    const reply=replyAsOcto(createOctoChat(),question);
    assert.match(reply.reply,/soldiers can miss shots/);
    assert.match(reply.reply,/veterans aim better/);
    assert.match(reply.reply,/go wide and deal no damage/);
    assert.match(reply.reply,/reloading does not reroll/);
    assert.equal(reply.links[0].href,'https://copperstudio.nl/games/mosswake-creek/');
  }
});
