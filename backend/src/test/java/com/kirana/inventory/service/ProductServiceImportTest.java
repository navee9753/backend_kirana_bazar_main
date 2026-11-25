package com.kirana.inventory.service;

import com.kirana.inventory.model.Product;
import com.kirana.inventory.repository.KhataRepository;
import com.kirana.inventory.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

class ProductServiceImportTest {

    @Test
    void exportsAllProductFieldsAndNeutralizesSpreadsheetFormulas() {
        ProductRepository productRepository = mock(ProductRepository.class);
        KhataRepository khataRepository = mock(KhataRepository.class);
        Product product = Product.builder()
                .name("=1+1")
                .brand("Tea, Assam")
                .category("Staples")
                .currentStock(new BigDecimal("2.500"))
                .minStockAlert(new BigDecimal("1.000"))
                .purchasePrice(new BigDecimal("10.00"))
                .mrp(new BigDecimal("15.00"))
                .isLooseItem(false)
                .build();
        product.setBarcode("8901234567890");
        when(productRepository.findAll()).thenReturn(List.of(product));
        ProductService service = new ProductService(productRepository, khataRepository);

        String csv = service.exportProductsCsv();

        assertEquals(
                "name,brand,category,barcode,current_stock,min_stock_alert,purchase_price,mrp,is_loose_item\r\n"
                        + "\"'=1+1\",\"Tea, Assam\",\"Staples\",\"8901234567890\",\"2.500\",\"1.000\",\"10.00\",\"15.00\",\"false\"\r\n",
                csv
        );
    }

    @Test
    void importsAllRowsFromCsv() {
        ProductRepository productRepository = mock(ProductRepository.class);
        KhataRepository khataRepository = mock(KhataRepository.class);
        when(productRepository.save(any(Product.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        ProductService service = new ProductService(productRepository, khataRepository);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "products.csv",
                "text/csv",
                ("name,brand,category,barcode,current_stock,min_stock_alert,purchase_price,mrp,is_loose_item\r\n"
                        + "Rice,Hulchul,Groceries,8901234567890,49.375,2.500,1900.00,2200.00,true\r\n"
                        + "Tea,Good Brand,Snacks,8901234567891,20,5,120.50,160.00,false\r\n")
                        .getBytes(StandardCharsets.UTF_8)
        );

        int imported = service.importProducts(file);

        assertEquals(2, imported);
        var productCaptor = org.mockito.ArgumentCaptor.forClass(Product.class);
        verify(productRepository, times(2)).save(productCaptor.capture());
        List<Product> products = productCaptor.getAllValues();
        assertEquals("Rice", products.get(0).getName());
        assertEquals("8901234567890", products.get(0).getBarcode());
        assertEquals("Tea", products.get(1).getName());
        assertEquals(0, new BigDecimal("5.000").compareTo(products.get(1).getMinStockAlert()));
        assertEquals(0, new BigDecimal("49.375").compareTo(products.get(0).getCurrentStock()));
        assertEquals(Boolean.TRUE, products.get(0).getIsLooseItem());
    }
}
