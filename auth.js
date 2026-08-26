import { supabase } from './supabase.js';

let isLogin = true;

// Vérifier si déjà connecté pour rediriger automatiquement
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        window.location.href = 'index.html';
    }
});

window.toggleMode = function() {
    isLogin = !isLogin;
    document.getElementById('form-title').innerText = isLogin ? 'Bienvenue sur BoloWork' : 'Rejoignez BoloWork';
    document.getElementById('form-subtitle').innerText = isLogin ? 'Connectez-vous pour accéder à votre réseau professionnel.' : 'Créez votre compte pour trouver des opportunités.';
    document.getElementById('submit-btn').innerText = isLogin ? 'Se connecter' : 'Créer mon compte';
    document.getElementById('toggle-text').innerText = isLogin ? 'Nouveau sur BoloWork ?' : 'Vous avez déjà un compte ?';
    document.getElementById('toggle-btn').innerText = isLogin ? 'S\'inscrire gratuitement' : 'Se connecter';
};

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerText;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-xl"></i>';
    btn.disabled = true;

    try {
        if (isLogin) {
            // CONNEXION
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.href = 'index.html';
        } else {
            // INSCRIPTION
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            
            if (data.session) {
                // Inscription et connexion directes réussies
                window.location.href = 'index.html';
            } else {
                // Supabase demande une confirmation par email (si configuré ainsi)
                alert("Inscription réussie ! (Si un email de confirmation vous a été envoyé, veuillez le valider).");
                window.toggleMode(); // Retour au mode login
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    } catch (error) {
        alert("Erreur : " + error.message);
        btn.innerText = originalText;
        btn.disabled = false;
    }
});
