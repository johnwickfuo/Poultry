DROP INDEX `Product_sellerId_slug_key` ON `Product`;
CREATE UNIQUE INDEX `Product_slug_key` ON `Product`(`slug`);
CREATE FULLTEXT INDEX `Product_marketplace_search_idx`
  ON `Product`(`name`, `shortDescription`, `description`, `brand`, `species`);
