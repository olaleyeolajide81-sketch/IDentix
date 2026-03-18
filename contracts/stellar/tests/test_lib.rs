use identix_contracts::{IdentixContract, DataKey, Identity, VerificationRequest};
use soroban_sdk::{symbol_short, Address, Env, Symbol, Vec};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, IdentixContract);
    let client = IdentixContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    client.initialize(&admin);
    
    assert_eq!(env.storage().instance().get(&DataKey::Admin), Some(admin));
}

#[test]
fn test_create_identity() {
    let env = Env::default();
    let contract_id = env.register_contract(None, IdentixContract);
    let client = IdentixContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    
    client.initialize(&admin);
    
    let data_hash = Vec::from_array(&env, [1, 2, 3, 4]);
    let timestamp = client.create_identity(&user, &data_hash);
    
    let identity: Identity = client.get_identity(&user).unwrap();
    assert_eq!(identity.owner, user);
    assert_eq!(identity.data_hash, data_hash);
    assert_eq!(identity.is_verified, false);
    assert_eq!(identity.verification_level, 0);
}

#[test]
fn test_register_verifier() {
    let env = Env::default();
    let contract_id = env.register_contract(None, IdentixContract);
    let client = IdentixContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    
    client.initialize(&admin);
    client.register_verifier(&verifier);
    
    assert!(client.is_verifier(&verifier));
}

#[test]
fn test_verification_flow() {
    let env = Env::default();
    let contract_id = env.register_contract(None, IdentixContract);
    let client = IdentixContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let verifier = Address::generate(&env);
    
    client.initialize(&admin);
    client.register_verifier(&verifier);
    
    // Create identity
    let data_hash = Vec::from_array(&env, [1, 2, 3, 4]);
    client.create_identity(&user, &data_hash);
    
    // Create verification request
    let request_type = symbol_short!("kyc");
    let request_id = client.create_verification_request(&user, &verifier, &request_type);
    
    // Process verification request
    client.process_verification_request(&request_id, &symbol_short!("approved"), &1);
    
    // Check identity is verified
    let identity: Identity = client.get_identity(&user).unwrap();
    assert_eq!(identity.is_verified, true);
    assert_eq!(identity.verification_level, 1);
}
