import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ref, set } from 'firebase/database';
import { databaseSocial } from '../services/firebaseappdb';
import { AuthContext } from '../contexts/AuthContext';
import { GOOGLE_API_KEY } from '../services/googleapikey';
import uuid from 'react-native-uuid';

type Props = {
  visible: boolean;
  photoUri: string;
  onCancel: () => void;
  onPostSuccess?: (postData: { texto: string; imagem: string; lugar: string }) => void;
};

type Lugar = {
  id: string;
  nome: string;
};

export default function CreatePostModal({ visible, photoUri, onCancel, onPostSuccess }: Props) {
  const { user } = useContext(AuthContext);
  const [texto, setTexto] = useState('');
  const [lugar, setLugar] = useState('');
  const [lugarSelecionado, setLugarSelecionado] = useState<Lugar | null>(null);
  const [loadingLugares, setLoadingLugares] = useState(false);
  const [lugaresSugestao, setLugaresSugestao] = useState<Lugar[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setTexto('');
      setLugar('');
      setLugarSelecionado(null);
      setLugaresSugestao([]);
    }
  }, [visible]);

  useEffect(() => {
    if (lugar.trim().length < 2) {
      setLugaresSugestao([]);
      return;
    }

    const fetchLugaresGoogle = async () => {
      setLoadingLugares(true);
      try {
        const url = 'https://places.googleapis.com/v1/places:searchText';
        const body = JSON.stringify({ textQuery: lugar });
        const headers = {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.name,places.formattedAddress,places.displayName',
        };

        const response = await fetch(url, { method: 'POST', headers, body });
        const json = await response.json();

        console.log('[Google Places] resposta:', json);

        if (json.places && json.places.length > 0) {
          const lugaresAPI: Lugar[] = json.places.map((place: any) => ({
            id: place.name,
            nome: place.displayName?.text || place.formattedAddress,
          }));
          setLugaresSugestao(lugaresAPI.slice(0, 5));
        } else {
          setLugaresSugestao([]);
        }
      } catch (error) {
        console.error('[Google Places] erro:', error);
        setLugaresSugestao([]);
      } finally {
        setLoadingLugares(false);
      }
    };

    fetchLugaresGoogle();
  }, [lugar]);

  const handleSelecionarLugar = (l: Lugar) => {
    setLugarSelecionado(l);
    setLugar(l.nome);
    setLugaresSugestao([]);
  };

  const handlePost = async () => {
    console.log('📤 Iniciando postagem...');

    if (!texto.trim()) return Alert.alert('Erro', 'O texto do post é obrigatório.');
    if (!lugarSelecionado) return Alert.alert('Erro', 'Você deve selecionar um local válido.');
    if (!photoUri) return Alert.alert('Erro', 'Imagem inválida.');
    if (!user || !user.cpf) return Alert.alert('Erro', 'Usuário inválido.');

    console.log('📝 Texto:', texto);
    console.log('📍 Lugar selecionado:', lugarSelecionado.nome);
    console.log('🖼️ URI da imagem:', photoUri);
    console.log('🧑 CPF do usuário:', user.cpf);

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('cpf', user.cpf);
      formData.append('imagem', {
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
        uri: photoUri,
      } as any);

      console.log('📦 Enviando imagem para o servidor FTP...');

      const res = await fetch('https://servidorprivadoigor.online/apppiaui/api/uploadimagempost.php', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const json = await res.json();
      console.log('📁 Resposta do upload:', json);

      if (!json.success || !json.url) {
        throw new Error(json.error || 'Falha no upload da imagem');
      }

      const postId = uuid.v4().toString();
      const postData = {
        texto: texto.trim(),
        imagem: json.url,
        lugar: lugarSelecionado.nome,
        curtidas: 0,
        data: new Date().toISOString(),
      };

      console.log('📤 Enviando post para o Firebase em:', `posts/${user.cpf}/${postId}`);
      await set(ref(databaseSocial, `posts/${user.cpf}/${postId}`), postData);

      Alert.alert('Sucesso', 'Post publicado com sucesso!');
      if (onPostSuccess) onPostSuccess(postData);
    } catch (err: any) {
      console.error('🚨 Erro ao postar:', err);
      Alert.alert('Erro', `Não foi possível publicar o post: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.title}>Novo Post</Text>

        <Text style={styles.label}>Texto principal *</Text>
        <TextInput
          multiline
          style={styles.textInput}
          placeholder="Escreva algo sobre sua foto..."
          value={texto}
          onChangeText={setTexto}
        />

        <Text style={styles.label}>Local *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Digite o nome do bar, restaurante, etc..."
          value={lugarSelecionado ? lugarSelecionado.nome : lugar}
          onChangeText={(text) => {
            setLugar(text);
            setLugarSelecionado(null);
          }}
          autoCorrect={false}
          autoCapitalize="words"
        />

        {lugarSelecionado && (
          <Text style={styles.lugarSelecionadoText}>Local selecionado: {lugarSelecionado.nome}</Text>
        )}

        {loadingLugares && <ActivityIndicator size="small" color="#007bff" />}

        {!loadingLugares && lugaresSugestao.length > 0 && !lugarSelecionado && (
          <FlatList
            data={lugaresSugestao}
            keyExtractor={(item) => item.id}
            style={styles.listaSugestoes}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelecionarLugar(item)} style={styles.sugestaoItem}>
                <Text>{item.nome}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelButton]}>
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePost}
            style={[styles.button, styles.postButton]}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>{uploading ? 'Enviando...' : 'Postar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#007bff',
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  listaSugestoes: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 6,
    marginBottom: 12,
  },
  sugestaoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  postButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  lugarSelecionadoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
});
