// src/pages/admin/HeroManagement.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Settings, Image as ImageIcon, Edit, Plus, Save, Trash2 } from "lucide-react";
import { API_URL } from "@/config/api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageFramingTool } from "@/components/admin/ImageFramingTool";
import { supabase } from "@/integrations/supabase/client";

interface HeroSlide {
  id?: string;
  image_url: string;
  order: number;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  image_fit?: "cover" | "contain" | "fill";
  image_position_x?: number;
  image_position_y?: number;
  image_zoom?: number;
}

interface HeroSetting {
  id: string;
  is_active: boolean;
  interval_ms: number;
  background_image_url?: string;
}

interface HeroData {
  settings: HeroSetting;
  slides: HeroSlide[];
}

const HeroManagement = () => {
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [is_active, setIsActive] = useState(true);
  const [interval_ms, setIntervalMs] = useState(5000);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [isSlideEditorOpen, setIsSlideEditorOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchHeroSettings();
  }, []);

  const fetchHeroSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/hero`);

      if (!response.ok) {
        throw new Error("Erro ao carregar configurações do Hero.");
      }

      const data: HeroData = await response.json();
      setHeroData(data);
      setIsActive(data.settings.is_active);
      setIntervalMs(data.settings.interval_ms);
      setSlides(
        data.slides.map((slide) => ({
          ...slide,
          image_position_x: slide.image_position_x ?? 50,
          image_position_y: slide.image_position_y ?? 50,
          image_zoom: slide.image_zoom ?? 100,
        }))
      );

      toast.success("Configurações carregadas com sucesso.");
    } catch (err) {
      console.error("Error fetching hero settings:", err);
      toast.error("Erro ao carregar configurações do Hero.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      const payload = {
        is_active: is_active,
        interval_ms: interval_ms,
        slides: slides.map((img, index) => ({
          image_url: img.image_url,
          order: index,
          title: img.title || "",
          subtitle: img.subtitle || "",
          cta_text: img.cta_text || "",
          cta_link: img.cta_link || "",
          image_position_x: img.image_position_x ?? 50,
          image_position_y: img.image_position_y ?? 50,
          image_zoom: img.image_zoom ?? 100,
        })),
      };

      const response = await fetch(`${API_URL}/hero`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao salvar no servidor.");
      }

      toast.success("Configurações atualizadas com sucesso!");
      setIsSlideEditorOpen(false);
      fetchHeroSettings();
    } catch (e) {
      toast.error("Erro ao salvar configurações.");
      console.error("Erro ao salvar:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("hero-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("hero-images")
        .getPublicUrl(filePath);

      const newSlide: HeroSlide = {
        image_url: data.publicUrl,
        order: slides.length,
        title: "",
        subtitle: "",
        image_position_x: 50,
        image_position_y: 50,
        image_zoom: 100,
      };

      setSlides([...slides, newSlide]);
      toast.success("Imagem adicionada com sucesso!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao fazer upload da imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const openEditDialog = (index: number) => {
    setEditingSlideIndex(index);
    setIsSlideEditorOpen(true);
  };

  const handleRemoveSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index));
    toast.success("Slide removido.");
  };

  const handleUpdateSlide = (field: keyof HeroSlide, value: any) => {
    if (editingSlideIndex === null) return;
    const newSlides = [...slides];
    newSlides[editingSlideIndex] = {
      ...newSlides[editingSlideIndex],
      [field]: value,
    };
    setSlides(newSlides);
  };

  const currentSlide = editingSlideIndex !== null ? slides[editingSlideIndex] : null;

  if (loading) {
    return (
      <div className="p-6 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="font-montserrat text-muted-foreground">
          Carregando configurações...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-foreground">
            Gerenciar Vitrine da Loja
          </h1>
          <p className="text-muted-foreground font-montserrat">
            Gerencie os textos e imagens do carrossel principal do site
          </p>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-montserrat font-semibold px-6 py-3 rounded-full shadow-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Card de Configurações Gerais */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="font-playfair flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base font-montserrat">Status da Vitrine</Label>
                <p className="text-sm text-muted-foreground font-montserrat">
                  {is_active
                    ? "Vitrine visível na página inicial"
                    : "Vitrine oculta"}
                </p>
              </div>
              <Switch checked={is_active} onCheckedChange={setIsActive} />
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat">
                Intervalo de Transição (milissegundos)
              </Label>
              <Input
                type="number"
                value={interval_ms}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                min={1000}
                step={500}
              />
              <p className="text-xs text-muted-foreground">
                Duração: {interval_ms / 1000} segundos por slide
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de Gerenciamento de Slides */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="font-playfair flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Slides da Vitrine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Botão para adicionar nova imagem */}
            <div className="flex justify-center border-2 border-dashed rounded-lg p-8">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={uploadingImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingImage}
                  onClick={(e) => {
                    e.preventDefault();
                    (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {uploadingImage ? "Enviando..." : "Adicionar Nova Imagem"}
                </Button>
              </label>
            </div>

            {/* Lista de Slides */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className="relative border rounded-lg overflow-hidden group"
                >
                  <div
                    className="w-full h-48 bg-no-repeat"
                    style={{
                      backgroundImage: `url(${slide.image_url})`,
                      backgroundSize: slide.image_zoom
                        ? `${slide.image_zoom}%`
                        : "cover",
                      backgroundPosition: `${slide.image_position_x}% ${slide.image_position_y}%`,
                    }}
                  />
                  
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-montserrat font-semibold">
                      Slide {index + 1}
                    </p>
                    {slide.title && (
                      <p className="text-xs font-semibold line-clamp-1">
                        {slide.title}
                      </p>
                    )}
                    {slide.subtitle && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditDialog(index)}
                      className="bg-white/90"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveSlide(index)}
                      className="bg-red-500/90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {slides.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground font-montserrat">
                    Nenhum slide adicionado. Clique em "Adicionar Nova Imagem" para começar.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Edição de Slide */}
      <Dialog open={isSlideEditorOpen} onOpenChange={setIsSlideEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-playfair">
              Editar Slide {editingSlideIndex !== null ? editingSlideIndex + 1 : ""}
            </DialogTitle>
          </DialogHeader>

          {currentSlide && (
            <div className="space-y-6">
              {/* Textos do Slide */}
              <div className="space-y-4">
                <h3 className="font-playfair text-lg font-semibold">Textos do Slide</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={currentSlide.title || ""}
                    onChange={(e) => handleUpdateSlide("title", e.target.value)}
                    placeholder="Ex: Elegância em Cada Ocasião"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(currentSlide.title || "").length}/100 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Textarea
                    id="subtitle"
                    value={currentSlide.subtitle || ""}
                    onChange={(e) => handleUpdateSlide("subtitle", e.target.value)}
                    placeholder="Ex: Alugue looks únicos para momentos especiais"
                    maxLength={255}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(currentSlide.subtitle || "").length}/255 caracteres
                  </p>
                </div>
              </div>

              {/* Ferramenta de Enquadramento */}
              <div className="space-y-4">
                <h3 className="font-playfair text-lg font-semibold">
                  Ajuste de Enquadramento da Imagem
                </h3>
                <ImageFramingTool
                  imageUrl={currentSlide.image_url}
                  positionX={currentSlide.image_position_x ?? 50}
                  positionY={currentSlide.image_position_y ?? 50}
                  zoom={currentSlide.image_zoom ?? 100}
                  onPositionChange={(x, y) => {
                    handleUpdateSlide("image_position_x", x);
                    handleUpdateSlide("image_position_y", y);
                  }}
                  onZoomChange={(zoom) => handleUpdateSlide("image_zoom", zoom)}
                  title={currentSlide.title}
                  subtitle={currentSlide.subtitle}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsSlideEditorOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setIsSlideEditorOpen(false);
                    toast.success("Alterações do slide atualizadas! Não esqueça de salvar.");
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  Aplicar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroManagement;
