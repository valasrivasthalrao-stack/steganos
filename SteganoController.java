package com.steganos.controller;

import com.steganos.model.*;
import com.steganos.service.SteganographyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

/**
 * SteganoController — REST API for STEGANOS.
 *
 * Endpoints
 * ---------
 * GET  /api/steg/health            → health probe
 * POST /api/steg/capacity          → image capacity info
 * POST /api/steg/encode            → embed message → base64 PNG JSON
 * POST /api/steg/encode/download   → embed message → raw PNG binary
 * POST /api/steg/decode            → extract + decrypt → JSON
 */
@Slf4j
@RestController
@RequestMapping("/api/steg")
@RequiredArgsConstructor
public class SteganoController {

    private final SteganographyService steg;

    // ── Health ───────────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status",    "UP",
            "service",   "STEGANOS API",
            "version",   "1.0.0",
            "timestamp", Instant.now().toString()
        ));
    }

    // ── Capacity ─────────────────────────────────────────────────────────────

    @PostMapping(value = "/capacity", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> capacity(@RequestParam("image") MultipartFile file) {
        try {
            validateImage(file);
            BufferedImage img = readImage(file.getBytes());
            if (img == null) return bad("Cannot read image file — try PNG or JPG.");

            long pixels = (long) img.getWidth() * img.getHeight();
            return ResponseEntity.ok(CapacityResponse.builder()
                .success(true)
                .width(img.getWidth()).height(img.getHeight())
                .pixelCount(pixels)
                .capacityChars(steg.getCapacity(pixels))
                .imageFormat(ext(file.getOriginalFilename()))
                .fileSizeBytes(file.getSize())
                .build());

        } catch (IllegalArgumentException e) { return bad(e.getMessage()); }
          catch (Exception e) { log.error("capacity", e); return err(e.getMessage()); }
    }

    // ── Encode → JSON ────────────────────────────────────────────────────────

    @PostMapping(value = "/encode", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> encode(
            @RequestParam("image")                              MultipartFile image,
            @RequestParam("message")                            String message,
            @RequestParam(value = "passkey", defaultValue = "") String passkey) {
        try {
            validateImage(image);
            if (message == null || message.isBlank()) return bad("Message cannot be empty.");

            log.info("ENCODE req — file:{} msg_len:{} passkey:{}",
                     image.getOriginalFilename(), message.length(), !passkey.isEmpty());

            byte[] imgBytes  = image.getBytes();
            byte[] msgBytes  = message.getBytes(StandardCharsets.UTF_8);
            byte[] payload   = passkey.isEmpty() ? msgBytes : steg.xorCipher(msgBytes, passkey);

            // Build ISO-8859-1 string: STGNS:: header + payload bytes
            String header    = SteganographyService.STEG_HEADER;
            byte[] headerB   = header.getBytes(StandardCharsets.ISO_8859_1);
            byte[] combined  = new byte[headerB.length + payload.length];
            System.arraycopy(headerB,  0, combined, 0,             headerB.length);
            System.arraycopy(payload,  0, combined, headerB.length, payload.length);
            String fullPayload = new String(combined, StandardCharsets.ISO_8859_1);

            // Capacity guard
            BufferedImage bimg = readImage(imgBytes);
            if (bimg == null) return bad("Cannot decode image.");
            long cap = steg.getCapacity((long) bimg.getWidth() * bimg.getHeight());
            if (combined.length > cap) return bad(String.format(
                "Message too large: %d bytes needed, image holds %d bytes. Use a larger image.",
                combined.length, cap));

            byte[] stego      = steg.encode(imgBytes, fullPayload);
            String b64        = Base64.getEncoder().encodeToString(stego);
            String filename   = "steganos_" + System.currentTimeMillis() + ".png";

            log.info("ENCODE ok — out:{} bytes", stego.length);
            return ResponseEntity.ok(EncodeResponse.builder()
                .success(true).message("Encoded successfully.")
                .imageBase64(b64).filename(filename)
                .originalWidth(bimg.getWidth()).originalHeight(bimg.getHeight())
                .capacityChars(cap).usedChars(message.length())
                .build());

        } catch (IllegalArgumentException e) { return bad(e.getMessage()); }
          catch (Exception e) { log.error("encode", e); return err(e.getMessage()); }
    }

    // ── Encode → binary PNG download ─────────────────────────────────────────

    @PostMapping(value = "/encode/download",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
                 produces = "image/png")
    public ResponseEntity<byte[]> encodeDownload(
            @RequestParam("image")                              MultipartFile image,
            @RequestParam("message")                            String message,
            @RequestParam(value = "passkey", defaultValue = "") String passkey) {
        try {
            validateImage(image);
            if (message == null || message.isBlank()) return ResponseEntity.badRequest().build();

            byte[] msgBytes  = message.getBytes(StandardCharsets.UTF_8);
            byte[] payload   = passkey.isEmpty() ? msgBytes : steg.xorCipher(msgBytes, passkey);
            byte[] headerB   = SteganographyService.STEG_HEADER.getBytes(StandardCharsets.ISO_8859_1);
            byte[] combined  = new byte[headerB.length + payload.length];
            System.arraycopy(headerB, 0, combined, 0,             headerB.length);
            System.arraycopy(payload, 0, combined, headerB.length, payload.length);

            byte[] stego    = steg.encode(image.getBytes(),
                                          new String(combined, StandardCharsets.ISO_8859_1));
            String filename = "steganos_" + System.currentTimeMillis() + ".png";

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(stego);

        } catch (Exception e) {
            log.error("encode/download", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── Decode ───────────────────────────────────────────────────────────────

    @PostMapping(value = "/decode", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> decode(
            @RequestParam("image")                              MultipartFile image,
            @RequestParam(value = "passkey", defaultValue = "") String passkey) {
        try {
            validateImage(image);
            log.info("DECODE req — file:{} passkey:{}", image.getOriginalFilename(), !passkey.isEmpty());

            String raw = steg.decode(image.getBytes());

            if (!raw.startsWith(SteganographyService.STEG_HEADER))
                return bad("No STEGANOS signature — image was not encoded with this tool.");

            String body = raw.substring(SteganographyService.STEG_HEADER.length());
            byte[] bodyBytes = body.getBytes(StandardCharsets.ISO_8859_1);

            String finalMsg;
            if (!passkey.isEmpty()) {
                byte[] dec = steg.xorCipher(bodyBytes, passkey);
                finalMsg   = new String(dec, StandardCharsets.UTF_8);
            } else {
                finalMsg = new String(bodyBytes, StandardCharsets.UTF_8);
            }

            if (!steg.isPrintable(finalMsg))
                return bad("Decryption produced non-printable characters — wrong passkey?");

            log.info("DECODE ok — {} chars", finalMsg.length());
            return ResponseEntity.ok(DecodeResponse.builder()
                .success(true).message("Extracted successfully.")
                .hiddenText(finalMsg).charCount(finalMsg.length())
                .wasEncrypted(!passkey.isEmpty())
                .build());

        } catch (IllegalStateException e) { return bad(e.getMessage()); }
          catch (Exception e) { log.error("decode", e); return err(e.getMessage()); }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void validateImage(MultipartFile f) {
        if (f == null || f.isEmpty())
            throw new IllegalArgumentException("No image file provided.");
        String ct = f.getContentType();
        if (ct == null || !ct.startsWith("image/"))
            throw new IllegalArgumentException("File must be an image (PNG, JPG, WEBP, BMP).");
        if (f.getSize() > 50L * 1024 * 1024)
            throw new IllegalArgumentException("Image exceeds 50 MB limit.");
    }

    private BufferedImage readImage(byte[] b) throws Exception {
        return ImageIO.read(new ByteArrayInputStream(b));
    }

    private String ext(String name) {
        if (name == null) return "?";
        int d = name.lastIndexOf('.');
        return d >= 0 ? name.substring(d + 1).toUpperCase() : "?";
    }

    private ResponseEntity<ErrorResponse> bad(String msg) {
        return ResponseEntity.badRequest().body(ErrorResponse.of("Bad Request", msg));
    }
    private ResponseEntity<ErrorResponse> err(String msg) {
        return ResponseEntity.internalServerError().body(ErrorResponse.of("Server Error", msg));
    }
}
