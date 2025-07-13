import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { ref, update, get } from 'firebase/database';
import { databaseSocial, database } from '../services/firebaseappdb';

type Comentario = {
  usuario: string;
  texto: string;
  data: string;
};

type Props = {
  cpfAutor: string;
  postId: string;
  comentarios?: Record<string, Comentario>;
  onComentariosUpdate?: () => void; // agora é opcional
};

export default function CommentsSection({ cpfAutor, postId, comentarios, onComentariosUpdate }: Props) {
  const { user } = useContext(AuthContext);
  const [novoComentario, setNovoComentario] = useState('');
  const [comentariosArray, setComentariosArray] = useState<
    { usuarioNome: string; texto: string; data: string }[]
  >([]);

  useEffect(() => {
    const processarComentarios = async () => {
      if (!comentarios) {
        setComentariosArray([]);
        return;
      }

      const arr = [];

      for (const key in comentarios) {
        const coment = comentarios[key];
        try {
          const snapUser = await get(ref(database, `users/cpf/${coment.usuario}`));
          const nome = snapUser.exists() ? snapUser.val().fullname || coment.usuario : coment.usuario;
          arr.push({
            usuarioNome: nome,
            texto: coment.texto,
            data: coment.data,
          });
        } catch {
          arr.push({
            usuarioNome: coment.usuario,
            texto: coment.texto,
            data: coment.data,
          });
        }
      }

      arr.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      setComentariosArray(arr);
    };

    processarComentarios();
  }, [comentarios]);

  const enviarComentario = async () => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para comentar.');
      return;
    }
    if (!novoComentario.trim()) {
      Alert.alert('Erro', 'Digite um comentário antes de enviar.');
      return;
    }

    const comentariosRef = ref(databaseSocial, `posts/${cpfAutor}/${postId}/comentarios`);
    const novoId = `coment${Date.now()}`;
    const dataAtual = new Date().toISOString();

    try {
      await update(comentariosRef, {
        [novoId]: {
          texto: novoComentario.trim(),
          usuario: user.cpf,
          data: dataAtual,
        },
      });
      setNovoComentario('');

      // ✅ Verificação segura antes de chamar
      if (typeof onComentariosUpdate === 'function') {
        onComentariosUpdate();
      } else {
        console.warn('[CommentsSection] Nenhuma função onComentariosUpdate fornecida.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar comentário.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comentários</Text>
      <FlatList
        data={comentariosArray}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <View style={styles.comentarioItem}>
            <Text style={styles.usuario}>{item.usuarioNome}:</Text>
            <Text style={styles.texto}>{item.texto}</Text>
            <Text style={styles.data}>{new Date(item.data).toLocaleString()}</Text>
          </View>
        )}
        style={styles.listaComentarios}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escreva um comentário..."
            value={novoComentario}
            onChangeText={setNovoComentario}
          />
          <TouchableOpacity onPress={enviarComentario} style={styles.botaoEnviar}>
            <Text style={styles.textoBotao}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    color: '#007bff',
  },
  listaComentarios: {
    maxHeight: 150,
  },
  comentarioItem: {
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  usuario: {
    fontWeight: '600',
    color: '#333',
  },
  texto: {
    marginLeft: 6,
    color: '#444',
  },
  data: {
    marginLeft: 6,
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 8,
    fontSize: 14,
    color: '#333',
  },
  botaoEnviar: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
