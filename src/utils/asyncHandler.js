
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export {
    asyncHandler
};



//const asyncHandler=()=>{}
//const asyncHandler=(function)=>{()=>{}}
//const asyncHandler=(function)=>async()=>{}

/*const asyncHandler = (fn) => async (req, res, next) => {
    try {
  await fn(req,res,next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }

}*/