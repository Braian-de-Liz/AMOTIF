// upload_service\main.go
package main

import (
	"log"
	"amotif-upload-service/config"
	"amotif-upload-service/handlers"
	"amotif-upload-service/service"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	cfg := config.LoadConfig()

	storageSvc := service.NewStorageService(cfg)
	
	uploadHdl := handlers.NewUploadHandler(storageSvc)

	app := fiber.New(fiber.Config{
		BodyLimit: 40 * 1024 * 1024, 
	})

	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
        AllowOrigins: "*", 
        AllowHeaders: "Origin, Content-Type, Accept, Authorization",
        AllowMethods: "GET, POST",
    }))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{
			"status":  "online",
			"service": "amotif-upload-service",
		})
	})

	app.Post("/upload", uploadHdl.HandleUpload)
	app.Get("/download/:filename", uploadHdl.HandleDownload)


	log.Printf("AMOTIF Upload Service rodando na porta %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}