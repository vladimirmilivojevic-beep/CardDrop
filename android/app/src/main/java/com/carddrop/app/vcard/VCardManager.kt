package com.carddrop.app.vcard

import android.graphics.Bitmap
import android.graphics.Color
import com.carddrop.app.data.Contact
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import java.util.UUID

object VCardManager {

    /**
     * Generate standard RFC-compliant vCard 3.0 string
     */
    fun generateVCard3(contact: Contact, compact: Boolean = false): String {
        val sb = StringBuilder()
        sb.append("BEGIN:VCARD\r\n")
        sb.append("VERSION:3.0\r\n")

        val fn = contact.formattedName.ifBlank {
            "${contact.firstName} ${contact.lastName}".trim().ifBlank { "Contact" }
        }
        sb.append("FN:$fn\r\n")
        sb.append("N:${contact.lastName};${contact.firstName};;;\r\n")

        if (contact.organization.isNotBlank()) {
            sb.append("ORG:${contact.organization}\r\n")
        }
        if (contact.title.isNotBlank()) {
            sb.append("TITLE:${contact.title}\r\n")
        }

        if (contact.phoneMobile.isNotBlank()) {
            sb.append("TEL;TYPE=CELL,VOICE:${contact.phoneMobile}\r\n")
        }
        if (contact.phoneWork.isNotBlank()) {
            sb.append("TEL;TYPE=WORK,VOICE:${contact.phoneWork}\r\n")
        }

        if (contact.emailWork.isNotBlank()) {
            sb.append("EMAIL;TYPE=WORK,INTERNET:${contact.emailWork}\r\n")
        }
        if (contact.emailPersonal.isNotBlank()) {
            sb.append("EMAIL;TYPE=HOME,INTERNET:${contact.emailPersonal}\r\n")
        }

        if (contact.addressFormatted.isNotBlank() && !compact) {
            sb.append("ADR;TYPE=WORK:;;${contact.addressFormatted};;;;\r\n")
        }

        if (contact.websiteUrl.isNotBlank()) {
            sb.append("URL:${contact.websiteUrl}\r\n")
        }

        if (contact.note.isNotBlank() && !compact) {
            sb.append("NOTE:${contact.note}\r\n")
        }

        sb.append("END:VCARD")
        return sb.toString()
    }

    /**
     * Parse raw vCard string (supports single or multi-vCard .vcf and MECARD)
     */
    fun parseVCard(rawText: String): List<Contact> {
        if (rawText.isBlank()) return emptyList()

        if (rawText.trim().startsWith("MECARD:")) {
            return listOfNotNull(parseMeCard(rawText.trim()))
        }

        val normalized = rawText.replace("\r\n", "\n").replace("\r", "\n")
        val blocks = Regex("BEGIN:VCARD[\\s\\S]*?END:VCARD", RegexOption.IGNORE_CASE)
            .findAll(normalized)
            .map { it.value }
            .toList()

        if (blocks.isEmpty()) {
            return if (normalized.contains("FN:") || normalized.contains("TEL:")) {
                listOf(parseSingleBlock(normalized))
            } else {
                emptyList()
            }
        }

        return blocks.map { parseSingleBlock(it) }
    }

    private fun parseSingleBlock(block: String): Contact {
        var fn = ""
        var firstName = ""
        var lastName = ""
        var org = ""
        var title = ""
        var phoneMobile = ""
        var phoneWork = ""
        var emailWork = ""
        var emailPersonal = ""
        var address = ""
        var website = ""
        var note = ""

        val lines = block.lines()
        for (rawLine in lines) {
            val line = rawLine.trim()
            if (line.isBlank() || line.startsWith("BEGIN:") || line.startsWith("END:") || line.startsWith("VERSION:")) {
                continue
            }

            val colonIdx = line.indexOf(':')
            if (colonIdx == -1) continue

            val header = line.substring(0, colonIdx).uppercase()
            val value = line.substring(colonIdx + 1).trim()
                .replace("\\n", "\n")
                .replace("\\,", ",")
                .replace("\\;", ";")

            when {
                header.startsWith("FN") -> fn = value
                header.startsWith("N") -> {
                    val parts = value.split(";")
                    lastName = parts.getOrNull(0) ?: ""
                    firstName = parts.getOrNull(1) ?: ""
                }
                header.startsWith("ORG") -> org = value.split(";").firstOrNull() ?: value
                header.startsWith("TITLE") || header.startsWith("ROLE") -> title = value
                header.startsWith("TEL") -> {
                    if (header.contains("WORK")) phoneWork = value
                    else if (phoneMobile.isBlank()) phoneMobile = value
                    else phoneWork = value
                }
                header.startsWith("EMAIL") -> {
                    if (header.contains("HOME") || header.contains("PERSONAL")) emailPersonal = value
                    else if (emailWork.isBlank()) emailWork = value
                    else emailPersonal = value
                }
                header.startsWith("ADR") -> {
                    val parts = value.split(";").filter { it.isNotBlank() }
                    address = parts.joinToString(", ")
                }
                header.startsWith("URL") -> website = value
                header.startsWith("NOTE") -> note = value
            }
        }

        val formattedName = fn.ifBlank {
            "${firstName} ${lastName}".trim().ifBlank { org.ifBlank { "Scanned Contact" } }
        }

        return Contact(
            id = UUID.randomUUID().toString(),
            firstName = firstName,
            lastName = lastName,
            formattedName = formattedName,
            organization = org,
            title = title,
            phoneMobile = phoneMobile,
            phoneWork = phoneWork,
            emailWork = emailWork,
            emailPersonal = emailPersonal,
            addressFormatted = address,
            websiteUrl = website,
            note = note,
            source = "scanned",
            rawVcard = block
        )
    }

    private fun parseMeCard(raw: String): Contact? {
        val content = raw.removePrefix("MECARD:")
        val fields = content.split(";")
        var fn = ""
        var phone = ""
        var email = ""
        var org = ""

        for (field in fields) {
            val colonIdx = field.indexOf(':')
            if (colonIdx == -1) continue
            val tag = field.substring(0, colonIdx).uppercase()
            val value = field.substring(colonIdx + 1).trim()
            when (tag) {
                "N" -> fn = value.replace(",", " ")
                "TEL" -> phone = value
                "EMAIL" -> email = value
                "ORG" -> org = value
            }
        }

        if (fn.isBlank() && phone.isBlank() && email.isBlank()) return null

        return Contact(
            id = UUID.randomUUID().toString(),
            formattedName = fn.ifBlank { "New Contact" },
            phoneMobile = phone,
            emailWork = email,
            organization = org,
            source = "scanned",
            rawVcard = raw
        )
    }

    /**
     * Generate high-resolution QR Bitmap using ZXing
     */
    fun generateQRCodeBitmap(
        content: String,
        width: Int = 800,
        height: Int = 800,
        darkColor: Int = Color.parseColor("#0F172A"),
        lightColor: Int = Color.WHITE
    ): Bitmap {
        val hints = mapOf(
            EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
            EncodeHintType.MARGIN to 1,
            EncodeHintType.CHARACTER_SET to "UTF-8"
        )
        val bitMatrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, width, height, hints)
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

        for (x in 0 until width) {
            for (y in 0 until height) {
                bitmap.setPixel(x, y, if (bitMatrix[x, y]) darkColor else lightColor)
            }
        }
        return bitmap
    }
}
