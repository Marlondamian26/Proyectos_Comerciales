export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason) => {
      console.error("[UNHANDLED REJECTION]", reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("[UNCAUGHT EXCEPTION]", {
        message: error.message,
        stack: error.stack,
      });
    });
  }
}
