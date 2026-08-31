-- CreateIndex
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductCategoryOnProduct_categoryId_idx" ON "ProductCategoryOnProduct"("categoryId");

-- CreateIndex
CREATE INDEX "Package_productId_idx" ON "Package"("productId");

-- CreateIndex
CREATE INDEX "ProductSpecification_productId_idx" ON "ProductSpecification"("productId");
