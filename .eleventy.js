module.exports = (eleventy) => {
  eleventy.addPassthroughCopy({ "public": "/" });

  eleventy.addShortcode("year", () => new Date().getFullYear());

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
