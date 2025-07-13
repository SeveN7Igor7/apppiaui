import React, { useEffect, useState, useContext, useRef } from 'react'; 
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Button,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { ref, onValue, update, get } from 'firebase/database';
import { databaseSocial } from '../services/firebaseappdb';
import { database } from '../services/firebase';
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Importação condicional da Camera para evitar erros
let Camera: any = null;
try {
  const cameraModule = require('expo-camera');
  Camera = cameraModule.Camera;
} catch (error) {
  console.warn('expo-camera não está disponível:', error);
}

// Import dos novos componentes
import CreatePostModal from '../components/CreatePostModal';
import CommentsSection from '../components/CommentsSection';

type Comentario = {
  usuario: string;
  texto: string;
  data: string;
};

type ComentarioComNome = Comentario;

type PostData = {
  texto?: string;
  local?: string;
  imagem?: string | null;
  curtidas?: number;
  comentarios?: Record<string, Comentario>;
  data?: string;
};

type Post = {
  cpfAutor: string;
  postId: string;
  dados: PostData;
  nomeCompleto?: string;
  avatar?: string;
  comentariosComNomes?: ComentarioComNome[];
};

export default function Social() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados câmera e post
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Modal criação post
  const [createPostVisible, setCreatePostVisible] = useState(false);

  // Controle de comentários expandidos por post
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Cache para nomes de usuários
  const fullnameCache: Record<string, string> = {};

  const getFullnameByCpf = async (cpf: string): Promise<string> => {
    if (fullnameCache[cpf]) return fullnameCache[cpf];
    try {
      const snap = await get(ref(database, `users/cpf/${cpf}`));
      if (snap.exists()) {
        const data = snap.val();
        const name = data.fullname || cpf;
        fullnameCache[cpf] = name;
        return name;
      }
      return cpf;
    } catch {
      return cpf;
    }
  };

  const processarComentarios = async (
    comentarios?: Record<string, Comentario>
  ): Promise<ComentarioComNome[]> => {
    if (!comentarios) return [];
    const comentariosProcessados: ComentarioComNome[] = [];

    for (const key in comentarios) {
      const coment = comentarios[key];
      const nomeUsuario = await getFullnameByCpf(coment.usuario);
      comentariosProcessados.push({
        usuario: nomeUsuario,
        texto: coment.texto,
        data: coment.data,
      });
    }

    comentariosProcessados.sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    return comentariosProcessados;
  };

  // Função que carrega os posts e atualiza o estado
  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);
    const postsRef = ref(databaseSocial, 'posts');
    onValue(postsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray: Post[] = [];

        for (const cpfAutor in data) {
          const postsDoAutor = data[cpfAutor];
          for (const postId in postsDoAutor) {
            const dados = postsDoAutor[postId];
            try {
              const userSnap = await get(ref(database, `users/cpf/${cpfAutor}`));
              let nomeCompleto = cpfAutor;
              let avatar = undefined;
              if (userSnap.exists()) {
                const userData = userSnap.val();
                nomeCompleto = userData.fullname || cpfAutor;
                avatar = userData.avatar || undefined;
              }

              const comentariosComNomes = await processarComentarios(dados.comentarios);

              postsArray.push({
                cpfAutor,
                postId,
                dados,
                nomeCompleto,
                avatar,
                comentariosComNomes,
              });
            } catch (e) {
              console.error('Erro ao buscar usuário do post:', e);
              postsArray.push({
                cpfAutor,
                postId,
                dados,
                nomeCompleto: cpfAutor,
              });
            }
          }
        }

        postsArray.sort((a, b) => {
          const dataA = a.dados.data ? new Date(a.dados.data).getTime() : 0;
          const dataB = b.dados.data ? new Date(b.dados.data).getTime() : 0;
          return dataB - dataA;
        });

        setPosts(postsArray);
      } else {
        setPosts([]);
      }
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  // Solicitar permissão da câmera
  useEffect(() => {
    (async () => {
      if (Camera && typeof Camera.requestCameraPermissionsAsync === 'function') {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(status === 'granted');
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        setHasCameraPermission(status === 'granted');
      }
    })();
  }, []);

  // Tirar foto (com expo-camera)
  const tirarFoto = async () => {
    if (cameraRef.current && Camera) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setPhotoUri(photo.uri);
          setCameraOpen(false);
          setCreatePostVisible(true);
        }
      } catch (error) {
        console.error('Erro ao tirar foto:', error);
        Alert.alert('Erro', 'Falha ao tirar foto');
      }
    }
  };

  // Alternativa: abrir câmera com ImagePicker
  const abrirImagePicker = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
        setCreatePostVisible(true);
      }
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', 'Falha ao abrir câmera');
    }
  };

  // Curtir post
  const handleLike = async (post: Post) => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para curtir.');
      return;
    }

    const curtidasAtual = post.dados.curtidas ?? 0;
    const novoCurtidas = curtidasAtual + 1;
    const postRef = ref(databaseSocial, `posts/${post.cpfAutor}/${post.postId}`);

    try {
      await update(postRef, { curtidas: novoCurtidas });
      setPosts((oldPosts) =>
        oldPosts.map((p) =>
          p.cpfAutor === post.cpfAutor && p.postId === post.postId
            ? { ...p, dados: { ...p.dados, curtidas: novoCurtidas } }
            : p
        )
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível curtir o post.');
      console.error(error);
    }
  };

  // Abrir câmera
  const handleOpenCamera = () => {
    if (hasCameraPermission === null) return;
    if (hasCameraPermission === false) {
      Alert.alert(
        'Permissão necessária',
        'Por favor, permita o acesso à câmera nas configurações do dispositivo.'
      );
      return;
    }

    if (Camera && typeof Camera === 'function') {
      setCameraOpen(true);
    } else {
      abrirImagePicker();
    }
  };

  // Alternar expansão dos comentários do post
  const toggleExpandComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Render comentário individual
  const renderComentario = (comentario: ComentarioComNome, index: number) => (
    <View key={index} style={styles.comentario}>
      <Text style={styles.comentUsuario}>{comentario.usuario}:</Text>
      <Text style={styles.comentTexto}>{comentario.texto}</Text>
    </View>
  );

  // Render post completo
  const renderPost = ({ item }: { item: Post }) => {
    const commentsToShow = expandedComments[item.postId]
      ? item.comentariosComNomes || []
      : (item.comentariosComNomes || []).slice(0, 3);
    const hasMoreComments =
      (item.comentariosComNomes?.length ?? 0) > 3 && !expandedComments[item.postId];

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {item.nomeCompleto?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.username}>{item.nomeCompleto}</Text>
        </View>

        {item.dados.texto && <Text style={styles.postText}>{item.dados.texto}</Text>}

        {item.dados.local && (
          <Text style={{ fontStyle: 'italic', marginBottom: 6, color: '#444' }}>
            📍 {item.dados.local}
          </Text>
        )}

        {item.dados.imagem && (
          <Image
            source={{ uri: item.dados.imagem }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.postFooter}>
          <TouchableOpacity onPress={() => handleLike(item)} style={styles.likeButton}>
            <Ionicons name="heart-outline" size={24} color="#f00" />
            <Text style={styles.likeText}>{item.dados.curtidas ?? 0}</Text>
          </TouchableOpacity>

          <View style={styles.commentCount}>
            <Ionicons name="chatbubble-outline" size={24} color="#555" />
            <Text style={styles.commentText}>{item.comentariosComNomes?.length ?? 0}</Text>
          </View>
        </View>

        {/* Exibição dos comentários diretamente no post */}
        <View style={styles.comentariosContainer}>
          {commentsToShow.length === 0 && (
            <Text style={{ fontStyle: 'italic', color: '#888' }}>Nenhum comentário</Text>
          )}
          {commentsToShow.map((comentario, idx) => renderComentario(comentario, idx))}
          {hasMoreComments && (
            <TouchableOpacity
              onPress={() => toggleExpandComments(item.postId)}
              style={{ marginTop: 4 }}
            >
              <Text style={{ color: '#007bff', fontWeight: 'bold' }}>
                Ver mais comentários...
              </Text>
            </TouchableOpacity>
          )}
          {expandedComments[item.postId] && (
            <TouchableOpacity
              onPress={() => toggleExpandComments(item.postId)}
              style={{ marginTop: 4 }}
            >
              <Text style={{ color: '#007bff', fontWeight: 'bold' }}>
                Ver menos
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seu componente CommentsSection (mantido conforme pedido) */}
        <CommentsSection cpfAutor={item.cpfAutor} postId={item.postId} />
      </View>
    );
  };

  // Modal da câmera
  const CameraModal = () => {
    if (!Camera || typeof Camera !== 'function') return null;

    return (
      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
          <Camera style={{ flex: 1 }} ref={cameraRef} type="back">
            <View style={styles.cameraControls}>
              <TouchableOpacity onPress={() => setCameraOpen(false)} style={styles.cameraCloseButton}>
                <Ionicons name="close-circle" size={40} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={tirarFoto} style={styles.cameraCaptureButton}>
                <Ionicons name="camera" size={40} color="black" />
              </TouchableOpacity>

              <View style={{ width: 40 }} />
            </View>
          </Camera>
        </SafeAreaView>
      </Modal>
    );
  };

  // Callback para cancelar criação de post
  const onCancelCreatePost = () => {
    setPhotoUri(null);
    setCreatePostVisible(false);
  };

  // Callback para post criado - atualiza lista
  const onPostCreated = () => {
    setPhotoUri(null);
    setCreatePostVisible(false);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.message}>Você precisa estar logado para acessar o feed social.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed Social</Text>
        <TouchableOpacity onPress={handleOpenCamera}>
          <Ionicons name="camera-outline" size={28} color="#007bff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Carregando feed...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centered}>
          <Text>Nenhum post disponível.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => `${item.cpfAutor}_${item.postId}`}
          renderItem={renderPost}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
          }
        />
      )}

      {/* Modais */}
      <CameraModal />
      {createPostVisible && photoUri && (
        <CreatePostModal
          photoUri={photoUri}
          onCancel={onCancelCreatePost}
          onPostCreated={onPostCreated}
          userCpf={user.cpf}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  listContentContainer: {
    paddingBottom: 100,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#333',
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  likeText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#f00',
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#555',
  },
  comentariosContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
  comentario: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  comentUsuario: {
    fontWeight: 'bold',
    marginRight: 6,
    color: '#555',
  },
  comentTexto: {
    flex: 1,
    color: '#333',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
  },
  cameraCloseButton: {
    padding: 5,
  },
  cameraCaptureButton: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 10,
  },
});
