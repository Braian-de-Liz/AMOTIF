// upload_service\service\storage.go
package service

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"
	"amotif-upload-service/config"
)

type StorageService struct {
	cfg    *config.Config
	client *http.Client 
}

func NewStorageService(cfg *config.Config) *StorageService {
	return &StorageService{
		cfg: cfg,
		client: &http.Client{
			Timeout: 30 * time.Second, 
		},
	}
}

func (s *StorageService) UploadAudio(fileName string, fileBody io.Reader, contentType string) (string, error) {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", 
		s.cfg.SupabaseURL, 
		s.cfg.StorageBucket, 
		fileName,
	)

	req, err := http.NewRequestWithContext(context.Background(), "POST", url, fileBody)
	if err != nil {
		return "", fmt.Errorf("erro ao criar request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.SupabaseKey)
	req.Header.Set("apikey", s.cfg.SupabaseKey)
	req.Header.Set("Content-Type", contentType)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("erro na conexão com Supabase: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("erro do Supabase (%d): %s", resp.StatusCode, string(errBody))
	}

	return fileName, nil
}

func (s *StorageService) GetAudioStream(fileName string) (io.ReadCloser, error) {
	url := fmt.Sprintf("%s/storage/v1/object/authenticated/%s/%s", 
		s.cfg.SupabaseURL, 
		s.cfg.StorageBucket, 
		fileName,
	)

	req, err := http.NewRequestWithContext(context.Background(), "GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.SupabaseKey)
	req.Header.Set("apikey", s.cfg.SupabaseKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("erro ao buscar arquivo: status %d", resp.StatusCode)
	}

	return resp.Body, nil
}