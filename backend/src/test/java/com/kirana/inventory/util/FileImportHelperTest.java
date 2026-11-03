package com.kirana.inventory.util;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FileImportHelperTest {

    @Test
    void parsesCsvWithQuotedCommasAndTrimsCells() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "products.csv",
                "text/csv",
                "\uFEFFname,brand,category\n\"Tea, Assam\", \"Good Brand\", Grocery\n".getBytes(StandardCharsets.UTF_8)
        );

        List<String[]> rows = FileImportHelper.parseFile(file);

        assertEquals(2, rows.size());
        assertArrayEquals(new String[]{"name", "brand", "category"}, rows.get(0));
        assertArrayEquals(new String[]{"Tea, Assam", "Good Brand", "Grocery"}, rows.get(1));
    }

    @Test
    void parsesFirstSheetOfXlsxUsingFormattedCellValues() throws IOException {
        byte[] content;
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Products");
            var header = sheet.createRow(0);
            header.createCell(0).setCellValue("name");
            header.createCell(1).setCellValue("mrp");
            var data = sheet.createRow(1);
            data.createCell(0).setCellValue("Rice");
            data.createCell(1).setCellValue(125.5);
            workbook.write(output);
            content = output.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "products.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                content
        );

        List<String[]> rows = FileImportHelper.parseFile(file);

        assertEquals(2, rows.size());
        assertArrayEquals(new String[]{"name", "mrp"}, rows.get(0));
        assertArrayEquals(new String[]{"Rice", "125.5"}, rows.get(1));
    }

    @Test
    void rejectsUnsupportedFileExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "products.txt",
                "text/plain",
                "name\nRice".getBytes(StandardCharsets.UTF_8)
        );

        assertThrows(IllegalArgumentException.class, () -> FileImportHelper.parseFile(file));
    }
}
