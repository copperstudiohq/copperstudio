export const cellLines = [
  'Mum was a goblin. Dad was an orc. I got her knees and his bad ideas.',
  'You got bread? A picture of bread? I can work with a picture.',
  'Been here so long the damp has a name. Trevor.',
  'They took my spoon. Accused it of helping me dig. It was doing its best.',
  'That latch is loose. I checked with my foot. Foot lost.',
  'I’m calling this one Boot. Lost the other one two winters ago.',
  'I named every rat. Ran out of names. Six of them are Kevin.',
  'I tried to tunnel out. Went sideways. Found more cell.',
  'The tall guard thinks I’m stupid. I think he’s tall. We’re both right.',
  'Can you open the gate? I’ve got nearly enough legs to run.',
  'I counted the days. Got to seven. Ate the chalk.',
  'I used to be taller. Or the floor was lower. One of us is lying.',
  'Don’t tell the guards I’m awake. Or awake-ish.',
  'I saved you half my dinner. It’s the half I imagined.',
  'If anyone asks, I am a very small sack of turnips.',
  'I can run fast for a bit. The bit after that is mostly wheezing.',
  'I’m wearing two shirts. One’s just dirt in a shirt shape.',
  'Mum said keep your head down. That’s easy when it starts down here.',
  'When I get out I’m eating something with a middle.',
  'I had a plan. It’s in my other boot.',
];
export const fieldLines = [
  'That’s a lot of brown. Did they run out of green?',
  'I’m going to the village. Unless the road goes somewhere with pie first.',
  'Outside smells different. Still bad, but different.',
  'Keep walking, legs. We can complain when we get there.',
];
export const villageLines = [
  'People here leave bread on shelves. I am learning some very hard lessons.',
  'I asked for work. They said start tomorrow. Great. Tomorrow never gets here.',
  'First thing I did with freedom was trip over it.',
  'I said hello to a goat. It made a better point than I did.',
  'I’d buy a new boot, but then the old one would feel left out.',
  'I’m looking for a job with sitting. Or a chair with wages.',
  'They call it a well. How do they know how it feels?',
  'Mum was a goblin. Dad was an orc. Neither one taught me what a rent is.',
  'The baker said my nose was pressed against the glass. It’s how I shop.',
  'So many houses. You people must have loads of spoons.',
  'I tried washing. The water gave up first.',
  'A shopkeeper called me a regular. I only fell off the stool twice.',
  'I thought the forest sign said free lunch. Those are very different letters.',
  'I’m keeping this pebble. It didn’t ask for anything.',
  'I know the way back to the well. Getting away from it is the hard bit.',
  'Do you think a chicken knows it’s a chicken? Don’t ask one on my behalf.',
  'I’m never eating prison soup again. Unless they put something in it this time.',
  'You opened that cell. I owe you a spoon. As soon as I have two.',
  'Someone sold me an invisible hat. Fits perfectly.',
  'Turns out fresh air is free. I checked three times.',
  'I walked all the way here on these legs. I’m as surprised as you.',
  'Good day to be outside. Terrible day to still have toes.',
  'Found a bed. It has a whole blanket. What a show-off.',
  'If I stand still near the bakery, I can smell lunch without paying.',
];

export const blubBarks = {
  gate: 'The door! Finally! Come on, legs!',
  escaped: 'Found the service stair! Bye, awful tower!',
  arrested: 'Oh no. I’m being arrested again.',
  caught: 'They got me. Next time I’m zigging. I only zagged.',
  tower: 'Service stair! I hope that’s an up stair.',
  dungeon: 'Go, go! My legs are on loan!',
  joined: 'I’m coming with you. My other plan was a ditch.',
};

export function blubClipName(line) {
  let hash = 2166136261;
  for (let i = 0; i < line.length; i++) hash = Math.imul(hash ^ line.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0') + '.mp3';
}
