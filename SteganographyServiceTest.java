package com.steganos;

import com.steganos.service.SteganographyService;
import org.junit.jupiter.api.*;
import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("SteganographyService Tests")
class SteganographyServiceTest {

    private SteganographyService svc;

    @BeforeEach void setUp() { svc = new SteganographyService(); }

    // ── XOR ──────────────────────────────────────────────────────────────────

    @Test @DisplayName("XOR is symmetric — double-apply returns original")
    void xorSymmetric() {
        byte[] data = "Hello STEGANOS!".getBytes(StandardCharsets.UTF_8);
        byte[] enc  = svc.xorCipher(data, "secret");
        byte[] dec  = svc.xorCipher(enc,  "secret");
        assertArrayEquals(data, dec);
    }

    @Test @DisplayName("XOR with empty key returns unchanged bytes")
    void xorEmptyKey() {
        byte[] data = "no encryption".getBytes();
        assertArrayEquals(data, svc.xorCipher(data, ""));
        assertArrayEquals(data, svc.xorCipher(data, null));
    }

    // ── Capacity ─────────────────────────────────────────────────────────────

    @Test @DisplayName("Capacity formula: 100×100 image → 3746 bytes")
    void capacityFormula() {
        assertEquals(3746L, svc.getCapacity(100L * 100));
    }

    // ── Round-trips ──────────────────────────────────────────────────────────

    @Test @DisplayName("Plain encode → decode recovers payload exactly")
    void roundTripPlain() throws Exception {
        byte[] img     = gradient(200, 200);
        String payload = SteganographyService.STEG_HEADER + "Unit test message 🔬";
        String decoded = svc.decode(svc.encode(img, payload));
        assertEquals(payload, decoded);
    }

    @Test @DisplayName("Encrypted encode → decode with correct key recovers message")
    void roundTripEncrypted() throws Exception {
        byte[] img     = gradient(300, 300);
        String message = "Top secret 🔐 12345";
        String key     = "passkey-99";

        byte[] msgB    = message.getBytes(StandardCharsets.UTF_8);
        byte[] encB    = svc.xorCipher(msgB, key);
        byte[] headerB = SteganographyService.STEG_HEADER.getBytes(StandardCharsets.ISO_8859_1);
        byte[] combined = new byte[headerB.length + encB.length];
        System.arraycopy(headerB, 0, combined, 0,             headerB.length);
        System.arraycopy(encB,    0, combined, headerB.length, encB.length);

        byte[] stego   = svc.encode(img, new String(combined, StandardCharsets.ISO_8859_1));
        String raw     = svc.decode(stego);

        assertTrue(raw.startsWith(SteganographyService.STEG_HEADER));
        String body    = raw.substring(SteganographyService.STEG_HEADER.length());
        byte[] decB    = svc.xorCipher(body.getBytes(StandardCharsets.ISO_8859_1), key);
        assertEquals(message, new String(decB, StandardCharsets.UTF_8));
    }

    @Test @DisplayName("Encoding oversized payload throws IllegalArgumentException")
    void encodeOversized() throws Exception {
        byte[] tinyImg = gradient(10, 10);   // ~37 bytes capacity
        assertThrows(IllegalArgumentException.class,
            () -> svc.encode(tinyImg, "X".repeat(500)));
    }

    @Test @DisplayName("Decoding a plain image throws IllegalStateException")
    void decodePlain() throws Exception {
        assertThrows(IllegalStateException.class, () -> svc.decode(gradient(100, 100)));
    }

    @Test @DisplayName("Stego image has same dimensions as original")
    void stegoSameDimensions() throws Exception {
        byte[] orig  = gradient(150, 100);
        byte[] stego = svc.encode(orig, SteganographyService.STEG_HEADER + "check");
        var i1 = ImageIO.read(new java.io.ByteArrayInputStream(orig));
        var i2 = ImageIO.read(new java.io.ByteArrayInputStream(stego));
        assertEquals(i1.getWidth(),  i2.getWidth());
        assertEquals(i1.getHeight(), i2.getHeight());
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private byte[] gradient(int w, int h) throws Exception {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
                img.setRGB(x, y, new Color((x * 255) / w, (y * 255) / h, 128).getRGB());
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }
}
