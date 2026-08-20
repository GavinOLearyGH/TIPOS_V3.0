const E = (name, how, cue) => ({ name, how, cue });

export const TIP7_WORK_SECONDS = 30;
export const TIP7_PREP_SECONDS = 10;

export const TIP7_DAYS = [
  {
    day:1, dimension:'STRETCH', theme:'OPEN', purpose:'Create some space.', check:'mobility',
    topics:['mobility','rotation'],
    exercises:[
      E('Cat-Cow','Start on hands and knees. Slowly round your spine toward the ceiling, then gently reverse by opening your chest and letting the belly lower. Keep flowing.','Move your whole spine.'),
      E('Thread the Needle','From hands and knees, reach one arm underneath the other as your chest rotates toward the floor. Return and reach upward. Switch sides halfway.','Rotate through your upper back.'),
      E('Wrist Rocks','Keep your palms flat with fingers forward. Gently rock your shoulders forward over your hands, then back. Keep the range comfortable.','Gentle pressure — never force the wrist.'),
      E("World's Greatest Stretch",'Step one foot forward into a long lunge. Support the opposite hand and rotate your chest toward the forward knee while reaching the other hand upward. Switch halfway.','Long spine. Open chest.'),
      E('90/90 Hip Switches','Sit with knees bent and feet apart. Drop both knees gently to one side, return through center, then move to the other side.','Let the hips rotate.'),
      E('Half-Kneeling Hip Flexor','One knee down, opposite foot forward. Get tall, gently tuck your pelvis and move forward slightly. Switch halfway.','Tall — not arched.'),
      E('Open Book','Lie on your side with knees together. Reach the top arm across and open your chest toward the floor behind you. Switch halfway.','Let your chest rotate.'),
      E('Ankle Rocks','With one foot planted, guide the knee forward over the toes while the heel stays grounded. Switch halfway.','Heel stays down.'),
      E('Shoulder Circles','Make large, slow shoulder or arm circles. Change direction halfway.','Relax your neck.'),
      E('Standing Side Bend','Reach one arm overhead and gently bend to the opposite side. Return and alternate.','Length before you bend.'),
      E('Standing Torso Rotation','Stand athletically and rotate side to side, letting the arms move naturally.','Easy, free rotation.'),
      E('Slow Golf Turn','Take golf posture and make slow backswing-and-through turns.','Does the turn feel freer?')
    ]
  },
  {
    day:2, dimension:'STRENGTH', theme:'STABLE', purpose:'Build the foundation.', check:'effort',
    topics:['stability','core'],
    exercises:[
      E('Golf Posture Squat','Sit into a comfortable athletic squat and stand tall.','Pressure through the whole foot.'),
      E('Wall Push-Up','Hands on a wall, body long and straight. Lower your chest and press away smoothly.','Controlled down. Strong up.'),
      E('Glute Bridge','Drive hips upward, squeeze the glutes, then lower with control.','Finish with the glutes.'),
      E('Bird Dog','Reach opposite arm and leg from hands and knees. Pause, return and switch.','Long body. Quiet trunk.'),
      E('Split Squat','Use a split stance and lower straight down through a comfortable range. Switch halfway.','Stable feet. Tall torso.'),
      E('Forearm Plank','Brace in a straight line on forearms and feet or knees while breathing normally.','Strong middle.'),
      E('Calf Raise','Rise onto the balls of the feet, pause, then lower smoothly.','Tall at the top.'),
      E('Single-Leg Hinge','Stand on one foot with a soft knee and hinge at the hip. Use support if needed. Switch halfway.','Hinge, do not fold.'),
      E('Standing Y-T-I','Hinge slightly forward and cycle slowly through Y, T and I arm positions.','Posture before range.'),
      E('Dead Bug','Brace on your back and slowly extend opposite arm and leg. Return and switch.','Ribs down.'),
      E('Balance Reach','Stand on one leg while reaching the opposite hand forward and free leg back. Switch halfway.','Own your center.'),
      E('Golf Posture Ground Press','Take golf posture and press both feet firmly into the floor for about three seconds, soften, repeat.','Feel the ground.')
    ]
  },
  {
    day:3, dimension:'STRETCH', theme:'ROTATE', purpose:'Turn without forcing it.', check:'mobility',
    topics:['rotation','mobility'],
    exercises:[
      E('Cat-Cow','Flow slowly through spinal flexion and extension.','Wake up the spine.'),
      E('Open Book','Lie on your side and open the top arm as the chest rotates. Switch halfway.','Upper back, not lower back.'),
      E('90/90 Hip Switches','Rotate the knees smoothly side to side from a seated position.','Let the hips turn.'),
      E('Half-Kneeling Rotation','From half kneeling, rotate the chest toward the lead leg and return. Switch halfway.','Stay tall.'),
      E("World's Greatest Stretch",'Use a long lunge with supported rotation. Switch halfway.','Hips and torso together.'),
      E('Standing Torso Rotation','Rotate side to side with relaxed arms.','Soft arms. Free turn.'),
      E('Golf Posture Separation','For 15 seconds rotate chest over quieter hips, then rotate hips beneath a quieter chest.','Separate the pieces.'),
      E('Shoulder Scaption','Raise the arms in a comfortable Y-shaped plane and lower with control.','Shoulders down from ears.'),
      E('Ankle Rocks','Guide the knee forward over the toes with the heel grounded. Switch halfway.','Smooth ankle range.'),
      E('Figure-4 Glute Stretch','Cross one ankle over the opposite knee and draw the legs gently toward you. Switch halfway.','Feel the glute, not the knee.'),
      E('Standing Side Bend','Reach overhead and lengthen through the side body. Alternate.','Long before lateral.'),
      E('Slow Golf Turn','Make slow turns from golf posture into backswing and finish.','Turn without forcing it.')
    ]
  },
  {
    day:4, dimension:'STRENGTH', theme:'BASE', purpose:'Build from the ground up.', check:'effort',
    topics:['lowerBody','stability'],
    exercises:[
      E('March in Place','March with purpose while staying tall. Drive the arms naturally and place each foot under control.','Tall posture.'),
      E('Bodyweight Squat','Sit your hips down and back to a comfortable depth, then stand tall.','Own the whole range.'),
      E('Wall Push-Up','Hands on the wall, body long and straight. Lower the chest and press away smoothly.','Controlled down. Strong up.'),
      E('Glute Bridge March','Lift into a glute bridge. Keeping hips level, lift one foot slightly, replace it and alternate. Use a normal bridge if needed.','Keep the pelvis quiet.'),
      E('Lateral Lunge','Step sideways and sit into one hip while the opposite leg stays longer. Push back and alternate.','Sit into the hip.'),
      E('Bird Dog','Reach opposite arm and leg from hands and knees. Pause, return and switch.','Long body. Quiet trunk.'),
      E('Calf Raise','Stand tall and rise onto the balls of your feet. Pause briefly, then lower.','Tall at the top.'),
      E('Forearm Plank','Brace in a straight line on forearms and feet or knees. Keep breathing.','Strong middle.'),
      E('Single-Leg Hinge','Stand on one foot with a soft knee. Reach the free leg backward as your torso hinges forward. Use a wall for balance. Switch halfway.','Hinge at the hip, not the spine.'),
      E('Standing Y-T-I','Hinge slightly forward and cycle slowly through Y, T and I arm positions.','Posture before range.'),
      E('Split Squat','Take a split stance and lower straight down through a comfortable range. Switch halfway.','Stable feet. Tall torso.'),
      E('Golf Posture Ground Press','Take golf posture. Without moving, press both feet into the floor for about three seconds, soften, repeat.','Feel the ground.')
    ]
  },
  {
    day:5, dimension:'STRETCH', theme:'RESTORE', purpose:'Move everything.', check:'mobility',
    topics:['mobility','recovery'],
    exercises:[
      E('Cat-Cow','Move slowly between rounded and gently extended spine positions on hands and knees.','Easy movement. Easy breathing.'),
      E("Child's Pose Reach",'Sit your hips toward your heels and reach forward. Gently walk the hands left and right.','Length through back and shoulders.'),
      E('Wrist + Forearm Stretch','Extend one arm and gently guide the fingers down, then up. Change arm halfway.','No aggressive pulling.'),
      E("World's Greatest Stretch",'Step into a long lunge, support one hand and rotate the chest toward the forward leg. Switch halfway.','Hips and upper back together.'),
      E('90/90 Hip Switches','Sit with knees bent and feet apart. Rotate the knees side to side smoothly.','Let the hips do the work.'),
      E('Figure-4 Glute Stretch','Lie on your back and cross one ankle over the opposite knee. Draw the legs gently toward you. Switch halfway.','Feel the glute, not the knee.'),
      E('Half-Kneeling Hip Flexor','Half-kneel, get tall, tuck the pelvis gently and shift forward. Switch halfway.','Front of the hip opens.'),
      E('Ankle Rock','Guide one knee forward over the toes while keeping heel grounded. Switch halfway.','Smooth ankle range.'),
      E('Shoulder Circles','Make large, slow circles with both shoulders or arms. Change direction halfway.','Relax the neck.'),
      E('Standing Side Bend','Reach one arm overhead and gently bend to the other side. Return and alternate.','Lengthen before bending.'),
      E('Standing Torso Rotation','Stand athletically and rotate side to side, allowing arms to move naturally.','Relaxed rotation.'),
      E('Slow Golf Turn','Return to golf posture and make slow turns into backswing and finish.','Does the turn feel easier than Minute 1?')
    ]
  },
  {
    day:6, dimension:'STRENGTH', theme:'CONTROL', purpose:'Own your movement.', check:'effort',
    topics:['stability','balance'],
    exercises:[
      E('Sit-to-Stand','Sit on a stable chair. Stand without momentum, then lower slowly. No chair? Use a bodyweight squat.','Control both directions.'),
      E('Wall Push-Up','Use a wall or sturdy elevated surface. Keep your body straight as you lower and press away.','Choose the version you can own.'),
      E('Dead Bug','Brace on your back and slowly extend opposite arm and leg. Return and switch.','Ribs down. Move slowly.'),
      E('Reverse Lunge','Step back into a controlled lunge and return. Alternate sides. Hold support if needed.','Quiet upper body.'),
      E('Side Plank — Knees','Set up on one forearm with knees bent and lift hips. Hold 15 seconds, then switch.','Long line from shoulder to knee.'),
      E('Single-Leg Glute Bridge','Bridge with one foot planted and the other leg light. Work one side for 15 seconds then switch. Use two feet if needed.','Drive through the heel.'),
      E('Balance Reach','Stand on one leg. Reach the opposite hand forward as free leg reaches back. Switch halfway.','Own your center.'),
      E('Wall Sit','Hold a comfortable wall sit while breathing steadily.','Steady legs. Relaxed face.'),
      E('Bird Dog + Pause','Reach opposite arm and leg, pause one full second, return and switch.','No trunk wobble.'),
      E('Calf Raise','Rise smoothly to the balls of the feet and lower under control.','Don’t bounce.'),
      E('Split Squat + Rotation','From a split stance, lower slightly and rotate toward the lead side. Switch halfway.','Stable base. Free chest.'),
      E('Golf Posture Balance','In golf posture, shift pressure gently lead foot, center, trail foot, center without swaying.','Control the center.')
    ]
  },
  {
    day:7, dimension:'STRETCH + STRENGTH', theme:'COMPLETE', purpose:'Put the week together.', check:'combo',
    topics:['mobility','stability','rotation'],
    exercises:[
      E('Cat-Cow','Flow slowly through spinal flexion and extension on hands and knees.','STRETCH · Open the spine.'),
      E('Golf Posture Squat','Sit into a comfortable athletic squat and stand tall with control.','STRENGTH · Build the legs.'),
      E('90/90 Hip Switches','Rotate both knees side to side from a seated position.','STRETCH · Open rotation.'),
      E('Wall Push-Up','Lower your chest toward the wall with a straight body, then press away.','STRENGTH · Upper-body push.'),
      E('Open Book','Lie on your side, knees together, and open the top arm as chest rotates. Switch halfway.','STRETCH · T-spine rotation.'),
      E('Glute Bridge','Drive hips upward from the floor, squeeze glutes and lower smoothly.','STRENGTH · Posterior chain.'),
      E("World's Greatest Stretch",'Use a long lunge with supported rotation. Switch halfway.','STRETCH · Hips + torso.'),
      E('Bird Dog','Reach opposite arm and leg, pause, return and alternate.','STRENGTH · Core stability.'),
      E('Ankle Rocks','Guide knee forward over toes with heel grounded. Switch halfway.','STRETCH · Ground connection.'),
      E('Split Squat','Lower under control in a split stance. Switch legs halfway.','STRENGTH · Lower-body stability.'),
      E('Golf Posture Separation','For 15 seconds rotate chest over quiet hips. Then for 15 seconds rotate hips beneath a quieter chest.','STRETCH · Separate the pieces.'),
      E('Full Golf Turn','Take golf posture. Make a slow backswing, move through and finish tall and balanced. Repeat.','Breathe. Turn. Swing free.')
    ]
  }
];

export function tip7Day(index) {
  return TIP7_DAYS[Math.max(0, Math.min(TIP7_DAYS.length - 1, index))];
}
