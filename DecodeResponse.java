package com.steganos.model;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DecodeResponse {
    private boolean success;
    private String  message;
    private String  hiddenText;
    private int     charCount;
    private boolean wasEncrypted;
}
