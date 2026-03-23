package com.steganos.model;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CapacityResponse {
    private boolean success;
    private int     width;
    private int     height;
    private long    pixelCount;
    private long    capacityChars;
    private String  imageFormat;
    private long    fileSizeBytes;
}
