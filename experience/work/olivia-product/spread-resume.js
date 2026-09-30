/** Prepare the complete reading model before any restored face is rendered. */
export function prepareSpreadResume(session,buildReading){
 const full=session.cardIds.length===session.count;
 const reading=full?buildReading():null;
 if(full&&(!reading||reading.cards?.length!==session.count))throw new TypeError('The restored spread reading is incomplete.');
 return {reading,full,slots:session.cardIds.map((cardId,index)=>({cardId,index,orientation:session.orientations[index],revealed:index<session.revealedCount}))};
}
