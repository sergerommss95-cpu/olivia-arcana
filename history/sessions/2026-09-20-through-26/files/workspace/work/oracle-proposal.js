/* Alternative Oracle poses: four unequal, densely laminated banks frame a small
   offset aperture. Unlike an evenly spaced iris, each bank is a short family of
   near-parallel rigid plates, bent around the opening through depth.
   Integration: const oraclePoses=buildOraclePoses(THREE,mobile); use oraclePoses[i]
   for the final pose. Returned objects match app pose(): {p:Vector3,q:Quaternion,s}.
   Card geometry must be 2.5 × 3.8, centered on its own origin. */
function buildOraclePoses(THREE, mobile=false) {
  // angle°, tangent offset, edge radius, depth, local lean°, local pitch°, scale
  // Right cheek: seven close laminations, strongest in the lower half.
  const rows=[
    [-11, -.14,.31, .32,36,-6,.67],
    [ -8, -.10,.34, .16,39,-4,.71],
    [ -5, -.04,.37, .00,42,-2,.76],
    [ -1,  .01,.40,-.16,44, 0,.80],
    [  3,  .06,.44,-.32,46, 2,.83],
    [  7,  .12,.47,-.48,48, 4,.85],
    [ 12,  .20,.49,-.63,50, 7,.85],
    // Crown: six broader plates, offset left and leaning into the depth.
    [ 79,-.23,.36, .44,27,-7,.71],
    [ 83,-.17,.39, .27,30,-4,.76],
    [ 87,-.10,.42, .10,34,-1,.80],
    [ 91,-.03,.44,-.07,38, 2,.84],
    [ 96, .06,.48,-.24,41, 4,.87],
    [102, .17,.51,-.41,44, 6,.88],
    // Left cheek: five narrower plates, tighter and more upright.
    [169,-.12,.28, .22,47, 6,.70],
    [174,-.06,.32, .04,49, 3,.74],
    [179, .00,.36,-.14,51, 0,.78],
    [185, .09,.40,-.32,53,-3,.80],
    [191, .20,.44,-.50,55,-6,.81],
    // Base: a short displaced counter-fold, closing the aperture below.
    [259,-.20,.34, .40,30, 6,.72],
    [265,-.11,.38, .18,34, 2,.79],
    [271, .00,.43,-.04,38,-2,.83],
    [278, .15,.47,-.26,42,-5,.86]
  ];
  const rad=Math.PI/180;
  const shellQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(.20,-.30,-.20));
  const shellCenter=new THREE.Vector3(mobile?.30:2.28,mobile?-1.62:.12,-24);
  const factor=mobile?.48:.92;
  const aperture=new THREE.Vector3(-.15,.13,.08);
  return rows.map(([angle,t,r,z,lean,pitch,scale])=>{
    const a=angle*rad;
    const localQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),a);
    localQ.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch*rad,lean*rad,0)));
    // Anchor every plate by its inward SHORT edge. The negative space therefore
    // stays open even though the bodies overlap heavily farther out.
    const inwardEdge=new THREE.Vector3(Math.cos(a)*r-Math.sin(a)*t,Math.sin(a)*r+Math.cos(a)*t,z).add(aperture);
    const fromEdge=new THREE.Vector3(1.25*scale,0,0).applyQuaternion(localQ);
    const p=inwardEdge.add(fromEdge).applyQuaternion(shellQ).multiplyScalar(factor).add(shellCenter);
    const q=shellQ.clone().multiply(localQ);
    return {p,q,s:scale*factor};
  });
}
