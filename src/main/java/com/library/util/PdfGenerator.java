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
            
            // Info table
            document.add(new Paragraph("Transaction ID: " + tx.getId(), bodyFont));
            document.add(new Paragraph("Book: " + tx.getBookTitle(), headFont));
            document.add(new Paragraph("Member: " + tx.getMemberName() + " (" + tx.getMemberCode() + ")", bodyFont));
            
            document.add(new Paragraph("--------------------------------------------", bodyFont));
            
            document.add(new Paragraph("Issued On: " + tx.getIssuedAt(), bodyFont));
            document.add(new Paragraph("Returned On: " + tx.getReturnedAt(), bodyFont));
            
            if (tx.getFineAmount() > 0) {
                Paragraph fine = new Paragraph("Fine Paid: ₹" + tx.getFineAmount(), headFont);
                fine.setSpacingBefore(10f);
                document.add(fine);
            } else {
                document.add(new Paragraph("Status: Returned (No Fine)", bodyFont));
            }
            
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("Thank you for using the Library System!", bodyFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);
            
            document.close();
            
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
