import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';
import { databaseSocial } from '../services/firebaseappdb'; // Importar databaseSocial
import { ref, set } from 'firebase/database';

const Colors = {
  primary: '#4A90E2',
  primaryDark: '#2F6BBF',
  accent: '#FFC107',
  background: '#F5F7FA',
  cardBackground: '#FFFFFF',
  textPrimary: '#333333',
  textSecondary: '#666666',
  error: '#D0021B',
  success: '#7ED321',
  warning: '#F5A623',
  border: '#E0E0E0',
};

export default function UploadImageScreen({ navigation }) {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    console.log('📤 Iniciando upload de imagem de perfil...');

    if (!image) {
      Alert.alert('Erro', 'Por favor, selecione uma imagem primeiro.');
      return;
    }
    if (!user || !user.cpf) {
      Alert.alert('Erro', 'Usuário não autenticado ou CPF não disponível.');
      console.error('🚨 Erro: Usuário ou CPF não disponível.', { user });
      return;
    }

    setUploading(true);
    try {
      const fileUri = image;
      const fileName = `profile_${user.cpf}_${Date.now()}.jpg`; // Nome de arquivo mais específico

      const formData = new FormData();
      formData.append('cpf', user.cpf); // Adicionar CPF ao formData
      formData.append('imagem', {
        name: fileName,
        type: 'image/jpeg',
        uri: fileUri,
      } as any);

      console.log('📦 Enviando imagem para o servidor...');

      const response = await fetch('https://servidorprivadoigor.online/apppiaui/api/uploadimagemperfil.php', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' }, // Manter este cabeçalho para FormData
      });

      // Tentar ler a resposta como texto primeiro para depuração
      const responseText = await response.text();
      console.log('📁 Resposta bruta do servidor:', responseText);

      let result;
      try {
        result = JSON.parse(responseText); // Tentar parsear como JSON
      } catch (parseError) {
        console.error('Erro ao parsear resposta como JSON:', parseError);
        Alert.alert('Erro', 'Resposta do servidor não é um JSON válido. Resposta: ' + responseText);
        setUploading(false);
        return;
      }

      // AQUI: Mudar result.imageUrl para result.url
      if (response.ok && result.success && result.url) {
        console.log('✅ Servidor retornou sucesso. URL da imagem:', result.url);
        console.log('ℹ️ CPF do usuário para Firebase:', user.cpf);

        // Salvar a URL da imagem no Firebase Realtime Database
        const firebasePath = `users/cpf/${user.cpf}/config/perfilimage`;
        const userImageRef = ref(databaseSocial, firebasePath);
        console.log('🔥 Caminho do Firebase:', firebasePath);
        console.log('💾 Salvando no Firebase:', { imageperfilurl: result.url });

        await set(userImageRef, {
          imageperfilurl: result.url,
        });
        console.log('🎉 Imagem salva no Firebase com sucesso!');
        Alert.alert('Sucesso', 'Imagem de perfil atualizada!');
        navigation.goBack(); // Volta para a tela anterior
      } else {
        console.error('❌ Falha no upload ou resposta do servidor inválida.', { responseOk: response.ok, resultSuccess: result.success, resultUrl: result.url, result });
        Alert.alert('Erro', result.message || 'Falha ao fazer upload da imagem. Resposta: ' + responseText);
      }
    } catch (error: any) {
      console.error('🚨 Erro no upload:', error);
      Alert.alert('Erro', `Ocorreu um erro ao tentar fazer upload da imagem: ${error.message || error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Upload de Imagem de Perfil</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <Ionicons name="camera-outline" size={80} color={Colors.textSecondary} />
          )}
          <Text style={styles.imagePickerText}>Selecionar Imagem</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={uploadImage}
          disabled={uploading || !image}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.uploadButtonText}>Fazer Upload</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePickerButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto-Medium',
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
});