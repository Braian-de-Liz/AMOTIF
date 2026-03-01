package handlers

import (
	"fmt"
	"time"
	"github.com/gofiber/fiber/v2"
	"amotif-upload-service/service"
)

type UploadHandler struct {
	storage *service.StorageService
}

func NewUploadHandler(s *service.StorageService) *UploadHandler {
	return &UploadHandler{storage: s}
}

func (h *UploadHandler) HandleUpload(c *fiber.Ctx) error {
	file, err := c.FormFile("audio")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Ficheiro de áudio não enviado"})
	}

	fileContent, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao abrir ficheiro"})
	}
	defer fileContent.Close()

	
	fileName := fmt.Sprintf("%d-%s", time.Now().Unix(), file.Filename)

	path, err := h.storage.UploadAudio(fileName, fileContent, file.Header.Get("Content-Type"))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Upload concluído com sucesso",
		"path":    path,
	})
}