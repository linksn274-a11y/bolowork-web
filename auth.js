import { supabase } from './supabase.js';

let isLogin = true;

// Redirection automatique si déjà connecté
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) window.location.href = 'index.html';
});

window.toggleMode = function() {
    isLogin = !isLogin;
    
    document.getElementById('name-field').classList.toggle('hidden', isLogin);
    document.getElementById('fullname').required = !isLogin;
    
    document.getElementById('form-title').innerText = isLogin ? 'Bienvenue sur BoloWork' : 'Rejoignez BoloWork';
    document.getElementById('form-subtitle').innerText = isLogin ? 'Connectez-vous avec votre numéro de téléphone.' : 'Créez votre compte en 10 secondes.';
    document.getElementById('submit-btn').innerText = isLogin ? 'Se connecter' : 'Créer mon compte';
    document.getElementById('toggle-text').innerText = isLogin ? 'Nouveau sur BoloWork ?' : 'Vous avez déjà un compte ?';
    document.getElementById('toggle-btn').innerText = isLogin ? 'S\'inscrire gratuitement' : 'Se connecter';
};

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rawPhone = document.getElementById('phone').value;
    const phone = rawPhone.replace(/[^0-9]/g, ''); // Ne garde que les chiffres
    const pin = document.getElementById('pin').value;
    const fullname = document.getElementById('fullname').value;
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerText;
    
    if (phone.length < 4) {
        alert("Le numéro entré (" + rawPhone + ") est trop court. Entrez au moins 4 chiffres pour tester.");
        return;
    }
    
    // ASTUCE MVP : On simule l'authentification par téléphone en utilisant l'Auth Email de Supabase sous le capot.
    // Cela permet d'avoir une DB sécurisée sans avoir à payer/configurer l'API SMS Twilio pour le moment.
    const fakeEmail = `user${phone}@bolowork.com`;
    const safePassword = `${pin}Bolo!`; // Supabase exige min 6 caractères
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-xl"></i>';
    btn.disabled = true;

    try {
        if (isLogin) {
            // CONNEXION
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email: fakeEmail, 
                password: safePassword 
            });
            if (error) {
                if (error.message.includes('Invalid login')) {
                    throw new Error("Numéro de téléphone ou code PIN incorrect.");
                }
                throw error;
            }
            window.location.href = 'index.html';
        } else {
            // INSCRIPTION
            const { data, error } = await supabase.auth.signUp({ 
                email: fakeEmail, 
                password: safePassword,
                options: {
                    data: {
                        full_name: fullname,
                        phone_number: phone
                    }
                }
            });
            if (error) {
                if (error.message.includes('already registered')) {
                    throw new Error("Ce numéro est déjà inscrit. Veuillez vous connecter.");
                }
                throw error;
            }
            
            // Si pas d'erreur, connexion réussie -> On redirige vers la création de profil !
            window.location.href = 'talent.html';
        }
    } catch (error) {
        alert("Erreur : " + error.message);
        btn.innerText = originalText;
        btn.disabled = false;
    }
});
