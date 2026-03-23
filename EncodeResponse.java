package com.steganos.model;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EncodeResponse {
    private boolean success;
    private String  message;
    private String  imageBase64;
    private String  filename;
    private int     originalWidth;
    private int     originalHeight;
    private long    capacityChars;
    private int     usedChars;
}
