package config

import (
	"bufio"
	"os"
	"strings"
)

type Config struct {
	SupabaseURL   string
	SupabaseKey   string
	StorageBucket string
	JwtPassword   string 
	Port          string
}

func LoadConfig() *Config {
	loadEnvFile(".env")

	return &Config{
		SupabaseURL:   getEnv("SUPABASE_URL", ""),
		SupabaseKey:   getEnv("SUPABASE_KEY", ""),
		StorageBucket: getEnv("StorageBucket", "audios-projetos"),
		JwtPassword:   getEnv("JWT_PASSWORD", ""), 
		Port:          getEnv("Port", "4444"),
	}
}

func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			
			value = strings.Trim(value, `"'`)
			
			os.Setenv(key, value)
		}
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
