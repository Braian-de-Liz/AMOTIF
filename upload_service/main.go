// upload_service\main.go
package main

import (
	"log"
	"amotif-upload-service/config"
	"amotif-upload-service/handlers"
	"amotif-upload-service/middleware"
	"amotif-upload-service/service"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	cfg := config.LoadConfig()

	if err := cfg.Validate(); err != nil {
		log.Fatalf("Erro na configuração: %v", err)
	}

	storageSvc := service.NewStorageService(cfg)
	uploadHdl := handlers.NewUploadHandler(storageSvc)
	authMw := middleware.NewAuthMiddleware(cfg.JwtPassword)

	app := fiber.New(fiber.Config{
		BodyLimit: 40 * 1024 * 1024,
	})

	app.Use(recover.New())
	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
		AllowOrigins: "https://amotif.app,https://www.amotif.app,http://localhost:5173,http://localhost:3000",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{
			"status":  "online",
			"service": "amotif-upload-service",
		})
	})

	app.Post("/upload", authMw.Authenticate, uploadHdl.HandleUpload)
	app.Get("/download/:filename", authMw.Authenticate, uploadHdl.HandleDownload)

	log.Printf("AMOTIF Upload Service rodando na porta %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
