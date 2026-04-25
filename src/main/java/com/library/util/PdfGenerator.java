package com.library.util;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfWriter;
import com.library.model.Transaction;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

/**
 * Utility class to generate PDF receipts for library transactions.
 */
public class PdfGenerator {

    /**
     * Generates a PDF receipt for a returned book and returns it as a Base64 string.
     */
    public static String generateReturnReceiptBase64(Transaction tx) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A6); // Receipt size
            PdfWriter.getInstance(document, baos);
            
            document.open();
            
            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font headFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font bodyFont  = FontFactory.getFont(FontFactory.HELVETICA, 10);
            
            // Header
            Paragraph title = new Paragraph("LIBRARY RECEIPT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" ")); // Spacer
            
            // Transaction Details
            document.add(new Paragraph("Transaction ID: " + tx.getId(), headFont));
            document.add(new Paragraph("Member Name: " + tx.getMemberName() + " (" + tx.getMemberCode() + ")", bodyFont));
            document.add(new Paragraph("Book Title: " + tx.getBookTitle(), bodyFont));
            document.add(new Paragraph("------------------------------------", bodyFont));
            
            // Dates
            document.add(new Paragraph("Issued On: " + tx.getIssuedAt(), bodyFont));
            document.add(new Paragraph("Due Date: " + tx.getDueDate(), bodyFont));
            document.add(new Paragraph("Returned On: " + tx.getReturnedAt(), bodyFont));
            
            // Fine
            if (tx.getFineAmount() > 0) {
                Font fineFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.UNDEFINED, java.awt.Color.RED);
                document.add(new Paragraph("Fine Collected: ₹" + String.format("%.2f", tx.getFineAmount()), fineFont));
            } else {
                document.add(new Paragraph("Fine: Nil", bodyFont));
            }
            
            document.add(new Paragraph("------------------------------------", bodyFont));
            Paragraph footer = new Paragraph("Thank you for using our library!", bodyFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);
            
            document.close();
            return Base64.getEncoder().encodeToString(baos.toByteArray());
            
        } catch (Exception e) {
            System.err.println("[PdfGenerator] Error generating PDF: " + e.getMessage());
            return null;
        }
    }
}
