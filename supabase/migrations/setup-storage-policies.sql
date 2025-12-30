-- Configurar políticas de segurança para o bucket 'uploads' no Supabase Storage
-- Este script deve ser executado no editor SQL do painel do Supabase

-- 1. Configurar políticas para a tabela storage.objects (onde os arquivos são armazenados)
-- Permitir upload para todos os usuários autenticados
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow authenticated users to read files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'uploads');

-- Permitir deleção para todos os usuários autenticados (se necessário)
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads');

-- 2. Configurar políticas para a tabela storage.buckets (gerenciamento de buckets)
-- Permitir que usuários autenticados vejam os buckets (necessário para funcionamento)
CREATE POLICY "Allow authenticated users to read buckets" ON storage.buckets
FOR SELECT TO authenticated
USING (name = 'uploads');

-- 3. Opcional: Configurar políticas mais restritas baseadas em roles ou IDs de usuário
-- Este exemplo permite que apenas usuários com uma condição específica façam uploads
-- CREATE POLICY "Allow specific users to upload files" ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'uploads' AND (auth.uid() = owner_id OR auth.role() = 'admin'));

-- 4. Verificar se o bucket 'uploads' existe
-- SELECT * FROM storage.buckets WHERE name = 'uploads';

-- Se o bucket não existir, crie-o primeiro:
-- INSERT INTO storage.buckets (id, name, public, allowed_mime_types, avif_autodetection, file_size_limit)
-- VALUES ('uploads', 'uploads', false, NULL, false, NULL);