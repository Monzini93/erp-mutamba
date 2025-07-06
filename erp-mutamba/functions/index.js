const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializa o app do Firebase Admin. A Cloud Function já tem as credenciais necessárias.
admin.initializeApp();

/**
 * Cloud Function para criar um novo usuário.
 * Esta função é 'callable', o que significa que pode ser chamada diretamente
 * pelo seu aplicativo web de forma segura.
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  // 1. Verificação de Segurança: Garante que a chamada venha de um usuário autenticado e que seja um admin.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "A requisição deve ser feita por um usuário autenticado."
    );
  }

  const adminDocRef = admin.firestore().collection("usuarios").doc(context.auth.uid);
  const adminDoc = await adminDocRef.get();

  if (!adminDoc.exists || adminDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas administradores podem criar novos usuários."
    );
  }

  // 2. Extração dos dados recebidos do formulário do ERP.
  const { email, password, nome, role = 'user' } = data;

  if (!email || !password || !nome) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Nome, e-mail e senha são obrigatórios."
    );
  }

  try {
    // 3. Cria o usuário no Firebase Authentication.
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: nome,
    });

    // 4. Cria o documento correspondente na coleção 'usuarios' no Firestore.
    const newUserDocRef = admin.firestore().collection("usuarios").doc(userRecord.uid);
    await newUserDocRef.set({
      nome: nome,
      email: email,
      role: role, // 'user' por padrão
      dataCriacao: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      result: `Usuário ${nome} (${email}) criado com sucesso.`,
      uid: userRecord.uid,
    };
  } catch (error) {
    // Trata erros comuns, como e-mail já existente.
    if (error.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError("already-exists", "Este e-mail já está em uso por outro usuário.");
    }
    // Para outros erros, lança um erro genérico.
    throw new functions.https.HttpsError("internal", "Ocorreu um erro ao criar o usuário.", error);
  }
});