const asyncHandler = (callbackFn) => {
    return (req, res, next) => {
        Promise.resolve(callbackFn(req, res, next)).catch((error) =>
            next(error)
        );
    };
};

export {asyncHandler};
