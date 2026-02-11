import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppSettings } from '@/hooks/useAppSettings';
import { toast } from 'sonner';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';

export const BrandingSettings: React.FC = () => {
  const { settings, updateSetting } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const currentLogoUrl = settings.logo_url;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

      await updateSetting.mutateAsync({ key: 'logo_url', value: urlData.publicUrl });
      toast.success('Logo updated successfully!');
    } catch (err: any) {
      toast.error('Failed to upload logo: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    try {
      await updateSetting.mutateAsync({ key: 'logo_url', value: null });
      toast.success('Custom logo removed. Default logo will be used.');
    } catch (err: any) {
      toast.error('Failed to remove logo');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Image className="h-5 w-5 mr-2" />
          Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Preview */}
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-lg border bg-card flex items-center justify-center overflow-hidden p-1 dark:bg-gray-900 bg-gray-100">
              <img
                src={currentLogoUrl || logoDark}
                alt="Logo preview (dark)"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="w-20 h-20 rounded-lg border bg-card flex items-center justify-center overflow-hidden p-1 dark:bg-gray-100 bg-white">
              <img
                src={currentLogoUrl || logoLight}
                alt="Logo preview (light)"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? 'Uploading...' : 'Upload Custom Logo'}
            </Button>
            {currentLogoUrl && (
              <Button size="sm" variant="destructive" onClick={handleRemove}>
                <Trash2 className="h-4 w-4 mr-1" />
                Remove Custom Logo
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {currentLogoUrl ? 'Using custom logo' : 'Using default logo'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
