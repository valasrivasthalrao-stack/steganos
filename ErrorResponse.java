package com.steganos.model;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ErrorResponse {
    private boolean success;
    private String  error;
    private String  details;
    private String  timestamp;

    public static ErrorResponse of(String error, String details) {
        return ErrorResponse.builder()
                .success(false).error(error).details(details)
                .timestamp(Instant.now().toString())
                .build();
    }
}
