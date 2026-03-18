#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

// Contract storage keys
#[contracttype]
pub enum DataKey {
    Identity(Address),
    Verifier(Address),
    VerificationRequest(u64),
    Admin,
}

// Identity structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Identity {
    pub owner: Address,
    pub data_hash: Vec<u8>,
    pub created_at: u64,
    pub updated_at: u64,
    pub is_verified: bool,
    pub verification_level: u8,
}

// Verification request structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationRequest {
    pub id: u64,
    pub identity_owner: Address,
    pub verifier: Address,
    pub request_type: Symbol,
    pub status: Symbol,
    pub created_at: u64,
    pub updated_at: u64,
}

// Main contract
#[contract]
pub struct IdentixContract;

#[contractimpl]
impl IdentixContract {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create a new identity
    pub fn create_identity(env: Env, owner: Address, data_hash: Vec<u8>) -> u64 {
        owner.require_auth();
        
        let identity = Identity {
            owner: owner.clone(),
            data_hash,
            created_at: env.ledger().timestamp(),
            updated_at: env.ledger().timestamp(),
            is_verified: false,
            verification_level: 0,
        };
        
        env.storage().instance().set(&DataKey::Identity(owner), &identity);
        env.ledger().timestamp()
    }

    /// Update identity data
    pub fn update_identity(env: Env, owner: Address, data_hash: Vec<u8>) {
        owner.require_auth();
        
        let mut identity: Identity = env.storage().instance()
            .get(&DataKey::Identity(owner.clone()))
            .unwrap_or_else(|| panic!("identity not found"));
        
        identity.data_hash = data_hash;
        identity.updated_at = env.ledger().timestamp();
        
        env.storage().instance().set(&DataKey::Identity(owner), &identity);
    }

    /// Get identity information
    pub fn get_identity(env: Env, owner: Address) -> Option<Identity> {
        env.storage().instance().get(&DataKey::Identity(owner))
    }

    /// Register a verifier
    pub fn register_verifier(env: Env, verifier: Address) {
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("admin not set"));
        
        admin.require_auth();
        
        env.storage().instance().set(&DataKey::Verifier(verifier.clone()), &true);
    }

    /// Create a verification request
    pub fn create_verification_request(
        env: Env,
        identity_owner: Address,
        verifier: Address,
        request_type: Symbol,
    ) -> u64 {
        identity_owner.require_auth();
        
        // Check if verifier is registered
        let is_verifier: bool = env.storage().instance()
            .get(&DataKey::Verifier(verifier.clone()))
            .unwrap_or(false);
        
        if !is_verifier {
            panic!("verifier not registered");
        }
        
        let request_id = env.ledger().sequence();
        let request = VerificationRequest {
            id: request_id,
            identity_owner: identity_owner.clone(),
            verifier: verifier.clone(),
            request_type,
            status: Symbol::short("pending"),
            created_at: env.ledger().timestamp(),
            updated_at: env.ledger().timestamp(),
        };
        
        env.storage().instance().set(&DataKey::VerificationRequest(request_id), &request);
        request_id
    }

    /// Process verification request
    pub fn process_verification_request(
        env: Env,
        request_id: u64,
        status: Symbol,
        verification_level: u8,
    ) {
        let mut request: VerificationRequest = env.storage().instance()
            .get(&DataKey::VerificationRequest(request_id))
            .unwrap_or_else(|| panic!("verification request not found"));
        
        request.verifier.require_auth();
        
        request.status = status;
        request.updated_at = env.ledger().timestamp();
        
        env.storage().instance().set(&DataKey::VerificationRequest(request_id), &request);
        
        // Update identity if verification is successful
        if status == Symbol::short("approved") {
            let mut identity: Identity = env.storage().instance()
                .get(&DataKey::Identity(request.identity_owner.clone()))
                .unwrap_or_else(|| panic!("identity not found"));
            
            identity.is_verified = true;
            identity.verification_level = verification_level;
            identity.updated_at = env.ledger().timestamp();
            
            env.storage().instance().set(&DataKey::Identity(request.identity_owner), &identity);
        }
    }

    /// Get verification request
    pub fn get_verification_request(env: Env, request_id: u64) -> Option<VerificationRequest> {
        env.storage().instance().get(&DataKey::VerificationRequest(request_id))
    }

    /// Check if address is a registered verifier
    pub fn is_verifier(env: Env, verifier: Address) -> bool {
        env.storage().instance()
            .get(&DataKey::Verifier(verifier))
            .unwrap_or(false)
    }
}
