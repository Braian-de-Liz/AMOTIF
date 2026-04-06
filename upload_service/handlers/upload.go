// upload_service\handlers\upload.go
package handlers

import (
	"fmt"
	"io"
	"mime"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"amotif-upload-service/service"
)

type UploadHandler struct {
	storage *service.StorageService
}

var allowedContentTypes = map[string]bool{
	"audio/mpeg":       true,
	"audio/wav":        true,
	"audio/x-wav":      true,
	"audio/ogg":        true,
	"audio/flac":       true,
	"audio/aac":        true,
	"audio/mp4":        true,
	"audio/x-m4a":      true,
}

func NewUploadHandler(s *service.StorageService) *UploadHandler {
	return &UploadHandler{storage: s}
}

func (h *UploadHandler) HandleUpload(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Usuário não autenticado"})
	}

	file, err := c.FormFile("audio")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Ficheiro de áudio não enviado"})
	}

	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = mime.TypeByExtension(filepath.Ext(file.Filename))
	}

	if !allowedContentTypes[contentType] {
		return c.Status(400).JSON(fiber.Map{
			"error": "Tipo de ficheiro não permitido. Use: MP3, WAV, OGG, FLAC, AAC",
		})
	}

	fileContent, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao abrir ficheiro"})
	}
	defer fileContent.Close()

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" {
		ext = ".mp3"
	}

	fileSize := file.Size
	if fileSize > 40*1024*1024 {
		return c.Status(400).JSON(fiber.Map{"error": "Ficheiro muito grande. Máximo 40MB"})
	}
	if fileSize == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Ficheiro vazio"})
	}

	fileName := fmt.Sprintf("%s/%d%s", userID, time.Now().UnixMilli(), ext)

	path, err := h.storage.UploadAudio(fileName, fileContent, contentType)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao fazer upload do ficheiro"})
	}

	return c.JSON(fiber.Map{
		"message":   "Upload concluído com sucesso",
		"path":      path,
		"fileName":  file.Filename,
		"fileSize":  fileSize,
		"userId":    userID,
	})
}

func (h *UploadHandler) HandleDownload(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Usuário não autenticado"})
	}

	fileName := c.Params("filename")

	if fileName == "" || strings.Contains(fileName, "..") || strings.Contains(fileName, "/") {
		return c.Status(400).JSON(fiber.Map{"error": "Nome de ficheiro inválido"})
	}

	if !strings.HasPrefix(fileName, userID+"/") {
		userDir := userID + "/"
		if !strings.HasPrefix(fileName, userDir) {
			return c.Status(403).JSON(fiber.Map{"error": "Acesso negado ao ficheiro"})
		}
	}

	stream, err := h.storage.GetAudioStream(fileName)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Áudio não encontrado"})
	}
	defer stream.Close()

	contentType := "audio/mpeg"
	ext := strings.ToLower(filepath.Ext(fileName))
	switch ext {
	case ".wav":
		contentType = "audio/wav"
	case ".ogg":
		contentType = "audio/ogg"
	case ".flac":
		contentType = "audio/flac"
	case ".aac", ".m4a":
		contentType = "audio/aac"
	}

	c.Set("Content-Type", contentType)
	c.Set("Content-Disposition", "inline; filename="+filepath.Base(fileName))

	_, err = io.Copy(c.Response().BodyWriter(), stream)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao enviar ficheiro"})
	}

	return nil
}
