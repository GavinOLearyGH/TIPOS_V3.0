# Full course prototype

Open `course/hole-1/` through a web server. This is an overhead layout review with a shared-engine shot sandbox. The 3D Hole 1 renderer is the next stage.

## Shared mechanics

- `core/physics.mjs` owns club calibration, ball flight, surface impact, bounce, rollout, putting, flagstick and cup contact. Both Hole 6's browser build and its server replay receive this engine through `node leaderboard/build.mjs`.
- `core/round.mjs` owns the 14-club course bag, successive shots, strokes, penalties and completion. Daily Challenge eligibility remains a game mode.
- `core/geometry.mjs` owns path sampling and surface containment.
- `core/course.mjs` turns a hole definition into terrain, lie and OB queries.
- `course/holes/hole-1.mjs` contains Hole 1's confirmed tees and yardages, traced surface boundaries, and provisional elevations.

Future 3D views should use the same course queries and round session as this overhead preview. Course geometry supplies metre coordinates, `ground(x,z)`, `surface(x,z)`, bounds, tees, pins and optional collision features. Wind and green speed are round settings. The engine contains no hole number or Springhaven layout coordinates. Full-course clubs use provisional carry and flight targets for testing.

Run `node leaderboard/build.mjs` to refresh the self-contained Hole 6 HTML, server physics, and generated course/core assets. Run `node tests/course.mjs` from the repository root to check the frozen Hole 6 replay comparison and shared full-hole behavior.

Hole 1 scale is calibrated to 419 yards between the black marker and green center. The other three marker distances are 401, 353 and 349 yards. Actual tee marker locations, bunker distances and contours require field confirmation. Current overhead shot aiming is a testing control. The established slingshot interface will use the same round and physics engine in the 3D stage.
