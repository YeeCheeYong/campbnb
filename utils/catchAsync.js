module.exports=func=>{
  return (req,res,next)=>{
    func(req,res,next).catch(next);
  }
}
// wrapAsync=f=>{
//   return function(req,res,next)
//   {
//     f(req,res,next).catch(e)
//     {
//       next(e)
//     }
//   }
// }