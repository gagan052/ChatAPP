export const printRoutes = (app: any) => {
  const routes: any[] = [];

  const extractRoutes = (
    stack: any[],
    basePath = ""
  ) => {
    stack.forEach((layer: any) => {
      // Route found
      if (layer.route) {
        const methods = Object.keys(
          layer.route.methods
        )
          .map((m) => m.toUpperCase())
          .join(", ");

        routes.push({
          Method: methods,
          Path:
            basePath + layer.route.path,
        });
      }

      // Router middleware
      else if (
        layer.handle?.stack
      ) {
        let path = "";

        // Express 5 matcher extraction
        if (layer.path) {
          path = layer.path;
        }

        extractRoutes(
          layer.handle.stack,
          basePath + path
        );
      }
    });
  };

  const stack =
    app.router?.stack ||
    app._router?.stack;

  if (!stack) {
    console.log(
      "No routes found"
    );
    return;
  }

  extractRoutes(stack);

  console.table(routes);
};