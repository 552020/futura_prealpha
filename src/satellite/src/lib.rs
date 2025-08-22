use candid::Nat;

use ic_cdk::api::management_canister::http_request::{
    http_request as http_request_outcall, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use junobuild_macros::{
    on_delete_asset, on_delete_doc, on_delete_many_assets, on_delete_many_docs, on_set_doc,
    on_set_many_docs, on_upload_asset,
};
use junobuild_satellite::{
    include_satellite, OnDeleteAssetContext, OnDeleteDocContext,
    OnDeleteManyAssetsContext, OnDeleteManyDocsContext, OnSetDocContext, OnSetManyDocsContext,
    OnUploadAssetContext,
};
use junobuild_utils::decode_doc_data;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct EmailRequest {
    from: String,
    to: String,
    subject: String,
    text: String,
    user_name: String,
    recipient_name: String,
}

#[derive(Serialize, Deserialize)]
struct EmailPayload {
    from: String,
    to: String,
    subject: String,
    text: String,
}

#[on_set_doc(collections = ["demo"])]
async fn on_set_doc(context: OnSetDocContext) -> Result<(), String> {
    ic_cdk::println!("📧 Email function triggered for document key: {}", context.data.key);
    
    let email_data: EmailRequest = match decode_doc_data(&context.data.data.after.data) {
        Ok(data) => {
            ic_cdk::println!("✅ Successfully decoded email data for: {} -> {}", data.user_name, data.recipient_name);
            data
        }
        Err(e) => {
            ic_cdk::println!("❌ Failed to decode email data: {}", e);
            return Err(format!("Failed to decode email data: {}", e));
        }
    };
    
    let email_payload = EmailPayload {
        from: email_data.from.clone(), 
        to: email_data.to.clone(),
        subject: email_data.subject.clone(),
        text: format!(
            "Hello {},\n\n{} has shared some files with you through Futura.\n\nYou can access your shared files at: https://futura.app\n\nBest regards,\nThe Futura Team",
            email_data.recipient_name,
            email_data.user_name
        ),
    };
    
    ic_cdk::println!("📝 Email payload created - From: {}, To: {}, Subject: {}", 
                     email_payload.from, email_payload.to, email_payload.subject);
    

    let json_body = match serde_json::to_string(&email_payload) {
        Ok(json) => {
            ic_cdk::println!("✅ Email payload serialized successfully, length: {} bytes", json.len());
            json
        }
        Err(e) => {
            ic_cdk::println!("❌ Failed to serialize email payload: {}", e);
            return Err(format!("Failed to serialize email payload: {}", e));
        }
    };

    let auth_token = std::env::var("NOTIFICATIONS_TOKEN").unwrap_or_default();
    ic_cdk::println!("🔑 Auth token present: {}", if auth_token.is_empty() { "NO" } else { "YES" });
    
    let request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "Authorization".to_string(),
            value: format!("Bearer {}", auth_token),
        },
        HttpHeader {
            name: "idempotency-key".to_string(),
            value: format!("futura-{}", context.data.key),
        },
    ];
    
    ic_cdk::println!("📡 Prepared {} headers for HTTP request", request_headers.len());

    let url = "https://observatory-7kdhmtcbfq-oa.a.run.app/notifications/email";
    ic_cdk::println!("🌐 Making HTTP POST request to: {}", url);
    
    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        method: HttpMethod::POST,
        body: Some(json_body.into_bytes()),
        max_response_bytes: Some(1000),
        transform: None,
        headers: request_headers,
    };

    ic_cdk::println!("⏳ Initiating HTTP outcall with 5s timeout...");
    
    match http_request_outcall(request, 5_000_000_000).await {
        Ok((response,)) => {
            ic_cdk::println!("📨 HTTP response received - Status: {}, Body length: {} bytes", 
                           response.status, response.body.len());
            
            if response.status >= Nat::from(200u32) && response.status < Nat::from(300u32) {
                ic_cdk::println!("✅ Email sent successfully to {}", email_data.to);
                Ok(())
            } else {
                let error_body = String::from_utf8_lossy(&response.body);
                ic_cdk::println!("❌ Email API error - Status: {}, Body: {}", response.status, error_body);
                Err(format!("Email API returned status {}: {}", response.status, error_body))
            }
        }
        Err((r, m)) => {
            ic_cdk::println!("❌ HTTP request failed - RejectionCode: {:?}, Error: {}", r, m);
            Err(format!("HTTP request failed. RejectionCode: {:?}, Error: {}", r, m))
        }
    }
}

#[on_delete_doc]
fn on_delete_doc(_context: OnDeleteDocContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_many_docs]
fn on_delete_many_docs(_context: OnDeleteManyDocsContext) -> Result<(), String> {
    Ok(())
}

#[on_upload_asset]
fn on_upload_asset(_context: OnUploadAssetContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_asset]
fn on_delete_asset(_context: OnDeleteAssetContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_many_assets]
fn on_delete_many_assets(_context: OnDeleteManyAssetsContext) -> Result<(), String> {
    Ok(())
}

#[on_set_many_docs]
async fn on_set_many_docs(_context: OnSetManyDocsContext) -> Result<(), String> {
    Ok(())
}

include_satellite!();