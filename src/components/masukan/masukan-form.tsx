'use client';

import { ImagePlus, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { AtmPagePanel } from '@/components/layout/atm-page-shell';
import { Button } from '@/components/ui/button';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  FEEDBACK_CATEGORIES,
  validateFeedbackEmail,
  validateFeedbackForm,
  validateFeedbackPhone,
} from '@/lib/feedback-form';
import { cn } from '@/lib/utils';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className='mt-1 text-xs text-destructive'>{message}</p>;
}

/** `children` = slot header server (disembunyikan saat success). */
export function MasukanForm({ children }: { children?: React.ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function validateField(field: 'email' | 'phone') {
    const errorMsg =
      field === 'email'
        ? validateFeedbackEmail(email)
        : validateFeedbackPhone(phone);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (errorMsg) next[field] = errorMsg;
      else delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const errors = validateFeedbackForm({
      name,
      email,
      phone,
      category,
      title,
      description,
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      let images: string[] = [];

      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((f) => formData.append('files', f));
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Gagal upload gambar');
        const uploadData = await uploadRes.json();
        images = uploadData.urls;
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          category,
          title,
          description,
          images,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.errors) setFieldErrors(data.errors);
        throw new Error(data.error ?? 'Gagal mengirim masukan');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim masukan');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSubmitted(false);
    setName('');
    setEmail('');
    setPhone('');
    setCategory('');
    setTitle('');
    setDescription('');
    setImageFiles([]);
    setImagePreviews([]);
    setFieldErrors({});
    setError('');
  }

  if (submitted) {
    return (
      <div className='py-8 text-center'>
        <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sunny/50 to-primary/30 text-4xl'>
          🎉
        </div>
        <h2 className='atm-page-title text-2xl font-extrabold' data-theme='masukan'>
          Makasih Ya!
        </h2>
        <p className='mt-2 text-muted-foreground'>
          Masukan kamu sudah kami terima. Tim SPPG akan segera meninjau dan
          menindaklanjuti.
        </p>
        <Button className='mt-6' onClick={resetForm}>
          Kirim Masukan Lain
        </Button>
      </div>
    );
  }

  return (
    <>
      {children}
      <AtmPagePanel variant='glass'>
      <Card className='charming-card border-0 bg-white/75 shadow-none backdrop-blur-sm'>
        <CardHeader>
          <CardTitle>📝 Formulir Masukan</CardTitle>
          <CardDescription>
            Isi data kamu dan ceritakan detailnya. Boleh lampirkan foto juga ya!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={handleSubmit} noValidate>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1.5 block text-sm font-medium'>
                    Nama Lengkap *
                  </label>
                  <Input
                    required
                    placeholder='Nama Anda'
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearFieldError('name');
                    }}
                    className={cn(fieldErrors.name && 'border-destructive')}
                  />
                  <FieldError message={fieldErrors.name} />
                </div>
                <div>
                  <label className='mb-1.5 block text-sm font-medium'>
                    Email
                  </label>
                  <Input
                    type='email'
                    placeholder='email@contoh.com'
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    onBlur={() => validateField('email')}
                    className={cn(fieldErrors.email && 'border-destructive')}
                  />
                  <FieldError message={fieldErrors.email} />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1.5 block text-sm font-medium'>
                    Telepon
                  </label>
                  <Input
                    type='tel'
                    inputMode='tel'
                    placeholder='08xxxxxxxxxx'
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearFieldError('phone');
                    }}
                    onBlur={() => validateField('phone')}
                    className={cn(fieldErrors.phone && 'border-destructive')}
                  />
                  <FieldError message={fieldErrors.phone} />
                </div>
                <div>
                  <label className='mb-1.5 block text-sm font-medium'>
                    Kategori *
                  </label>
                  <Select
                    required
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      clearFieldError('category');
                    }}
                    className={cn(fieldErrors.category && 'border-destructive')}
                  >
                    <option value=''>Pilih kategori</option>
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={fieldErrors.category} />
                </div>
              </div>

              <div>
                <label className='mb-1.5 block text-sm font-medium'>
                  Judul Singkat *
                </label>
                <Input
                  required
                  placeholder='Ringkasan masukan Anda'
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearFieldError('title');
                  }}
                  className={cn(fieldErrors.title && 'border-destructive')}
                />
                <FieldError message={fieldErrors.title} />
              </div>

              <div>
                <label className='mb-1.5 block text-sm font-medium'>
                  Deskripsi Detail *
                </label>
                <Textarea
                  required
                  rows={5}
                  placeholder='Jelaskan masukan atau temuan Anda secara detail...'
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearFieldError('description');
                  }}
                  className={cn(fieldErrors.description && 'border-destructive')}
                />
                <FieldError message={fieldErrors.description} />
              </div>

              <div>
                <label className='mb-1.5 block text-sm font-medium'>
                  Gambar Temuan
                </label>
                <div
                  className='flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-8 transition hover:border-primary/50 hover:bg-muted/30'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className='mb-2 h-8 w-8 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground'>
                    Klik untuk pilih gambar (maks. 5 foto, 5MB per file)
                  </p>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    onChange={handleFileChange}
                  />
                </div>
                {imagePreviews.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {imagePreviews.map((src, i) => (
                      <div key={src} className='relative'>
                        {/* Preview lokal blob URL — next/image tidak perlu */}
                        <img
                          src={src}
                          alt=''
                          className='h-20 w-20 rounded-lg border object-cover'
                        />
                        <button
                          type='button'
                          onClick={() => removeImage(i)}
                          className='absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-white'
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className='text-sm text-destructive'>{error}</p>}
              <Button
                type='submit'
                className='w-full sm:w-auto'
                disabled={submitting}
              >
                <Send className='h-4 w-4' />
                {submitting ? 'Mengirim...' : 'Kirim Masukan'}
              </Button>
            </form>
        </CardContent>
      </Card>
    </AtmPagePanel>
    </>
  );
}
