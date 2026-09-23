package com.example.booking.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RedissonConfig {

    @Value("${redis.address:redis://localhost:6379}")
    private String redisAddress;

    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        Config config = new Config();
        // Swap to useClusterServers()/useSentinelServers() for prod topologies.
        config.useSingleServer()
                .setAddress(redisAddress)
                .setConnectionPoolSize(64)
                .setConnectionMinimumIdleSize(8);
        return Redisson.create(config);
    }
}
