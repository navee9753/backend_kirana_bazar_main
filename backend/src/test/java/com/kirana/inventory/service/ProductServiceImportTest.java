package com.kirana.inventory.service;

import com.kirana.inventory.model.Product;
import com.kirana.inventory.repository.KhataRepository;
import com.kirana.inventory.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

class ProductServiceImportTest {

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
                ("name,brand,category,current_stock,min_stock_alert,purchase_price,mrp\r\n"
                        + "Rice,Hulchul,Groceries,48,12,1900.00,2200.00\r\n"
                        + "Tea,Good Brand,Snacks,20,5,120.50,160.00\r\n")
                        .getBytes(StandardCharsets.UTF_8)
        );

        int imported = service.importProducts(file);

        assertEquals(2, imported);
        var productCaptor = org.mockito.ArgumentCaptor.forClass(Product.class);
        verify(productRepository, times(2)).save(productCaptor.capture());
        List<Product> products = productCaptor.getAllValues();
        assertEquals("Rice", products.get(0).getName());
        assertEquals("Tea", products.get(1).getName());
        assertEquals(5, products.get(1).getMinStockAlert());
    }
}
