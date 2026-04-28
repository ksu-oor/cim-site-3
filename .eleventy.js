module.exports = (eleventy) => {
  eleventy.addPassthroughCopy({ "public": "/" });
  eleventy.addPassthroughCopy({ "admin": "/admin" });

  eleventy.addShortcode("year", () => new Date().getFullYear());

  // Encode &, <, > but leave quotes raw — matches the existing HTML's
  // character handling (which uses &amp; and &lt; but raw apostrophes).
  eleventy.addFilter("h", (input) => {
    if (input === null || input === undefined) return "";
    return String(input)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  });

  eleventy.setNunjucksEnvironmentOptions({ autoescape: false });

  return {
    dir: {
      input: "src",
      includes: "../_includes",
      data: "../content",
      output: "_site",
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
