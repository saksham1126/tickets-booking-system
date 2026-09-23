package com.example.booking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Enables STOMP-over-WebSocket messaging.
 *
 * Two things this sets up:
 *
 * 1. The CONNECTION endpoint ("/ws") - this is the URL the React frontend
 *    opens a WebSocket to, the way it currently opens an HTTP connection to
 *    call REST endpoints. Think of it as the "phone line" being opened.
 *
 * 2. The BROKER prefix ("/topic") - once connected, clients SUBSCRIBE to
 *    specific topics, e.g. "/topic/seatmap/1" for event_instance_id=1's
 *    seat map. The server then PUSHES messages to that topic whenever a
 *    seat's status changes (held/released/booked), and every subscribed
 *    client receives it instantly - no polling required.
 *
 * setAllowedOriginPatterns("*") is intentionally permissive here since this
 * is a local dev/portfolio project; in production you'd lock this down to
 * your actual frontend's origin.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // simple in-memory broker - fine for a single instance / portfolio
        // scale; a real multi-instance deployment would plug in an
        // external broker (e.g. RabbitMQ) here instead via enableStompBrokerRelay
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // fallback for browsers/networks that block raw WebSocket
    }
}
