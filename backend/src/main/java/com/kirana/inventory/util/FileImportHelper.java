package com.kirana.inventory.util;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

public final class FileImportHelper {

    private static final Pattern CSV_DELIMITER =
            Pattern.compile(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
    private static final long MAX_FILE_SIZE_BYTES = 20L * 1024 * 1024;
    private static final int MAX_ROWS = 10_001;

    private FileImportHelper() {}

    public static List<String[]> parseFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("The uploaded file is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("The uploaded file must be 20 MB or smaller.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("The uploaded file must have a filename.");
        }

        String lowerFilename = filename.toLowerCase(Locale.ROOT);
        if (lowerFilename.endsWith(".csv")) {
            return parseCsv(file);
        }
        if (lowerFilename.endsWith(".xlsx") || lowerFilename.endsWith(".xls")) {
            return parseWorkbook(file);
        }
        throw new IllegalArgumentException("Unsupported file type. Upload a CSV, XLS, or XLSX file.");
    }

    private static List<String[]> parseCsv(MultipartFile file) {
        List<String[]> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (rows.size() >= MAX_ROWS) {
                    throw new IllegalArgumentException("The file cannot contain more than 10,000 data rows.");
                }
                String[] cells = CSV_DELIMITER.split(line, -1);
                for (int index = 0; index < cells.length; index++) {
                    String value = cells[index].trim().replace("\"", "");
                    if (rows.isEmpty() && index == 0) {
                        value = value.replace("\uFEFF", "");
                    }
                    cells[index] = value;
                }
                rows.add(cells);
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the uploaded CSV file.", exception);
        }
        return rows;
    }

    private static List<String[]> parseWorkbook(MultipartFile file) {
        List<String[]> rows = new ArrayList<>();
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            if (workbook.getNumberOfSheets() == 0) {
                throw new IllegalArgumentException("The spreadsheet does not contain a worksheet.");
            }

            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            for (Row row : sheet) {
                if (rows.size() >= MAX_ROWS) {
                    throw new IllegalArgumentException("The file cannot contain more than 10,000 data rows.");
                }

                int lastCell = Math.max(0, row.getLastCellNum());
                String[] cells = new String[lastCell];
                for (int column = 0; column < lastCell; column++) {
                    cells[column] = formatter.formatCellValue(row.getCell(column)).trim();
                }
                rows.add(cells);
            }
        } catch (IOException | RuntimeException exception) {
            if (exception instanceof IllegalArgumentException illegalArgumentException) {
                throw illegalArgumentException;
            }
            throw new IllegalArgumentException("Unable to read the uploaded Excel file.", exception);
        }
        return rows;
    }
}
