import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

class LegalAnalysisService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }
        
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = new ChatGoogleGenerativeAI({
            apiKey: this.apiKey,
            model: 'gemini-1.5-flash',
            temperature: 0.3,
            maxOutputTokens: 2048,
        });
    }/**
     * Perform comprehensive legal analysis of contract text
     */
    async analyzeLegalDocument(text, documentType = 'contract') {
        try {            const analysisPrompt = `
You are an expert legal analyst specializing in contract law and document review. 
Analyze the following ${documentType} text and provide a comprehensive legal analysis.

Document Type: ${documentType}
Document Text:
${text}

Please provide a detailed analysis covering the following aspects. Use clear formatting with headers, bullet points, and emphasis:

# Document Overview
- Type of document and its purpose
- Key parties involved
- Main subject matter

# Legal Structure Analysis
- Identify key legal clauses and provisions
- Review contract formation elements (offer, acceptance, consideration)
- Assess legal language clarity and precision

# Rights and Obligations
## Party A's Rights and Obligations
- List specific rights
- List specific obligations

## Party B's Rights and Obligations
- List specific rights
- List specific obligations

## Mutual Obligations
- Shared responsibilities

# Risk Assessment
**CRITICAL RISKS:**
- Potential legal risks and vulnerabilities
- Areas of ambiguity or unclear terms
- Missing clauses or provisions

# Compliance and Regulatory Issues
- Applicable laws and regulations
- Compliance requirements
- Jurisdictional considerations

# Terms and Conditions Analysis
- **Payment terms** and conditions
- **Performance obligations**
- **Termination** and cancellation clauses
- **Dispute resolution** mechanisms

# Red Flags and Concerns
**WARNING:** Identify potentially problematic areas:
- Potentially problematic clauses
- Unfair or heavily weighted terms
- Legal enforceability issues

# Recommendations
**IMPORTANT ACTIONS:**
- Suggested improvements or modifications
- Additional clauses to consider
- Legal advice for moving forward

**DISCLAIMER:** This analysis is for informational purposes only and does not constitute legal advice. 
Consult with a qualified attorney for specific legal guidance.

Format your response with clear headers (use # and ##), bullet points (use -), and emphasis (**bold**) for important terms.
`;

            const result = await this.model.invoke(analysisPrompt);

            return {
                success: true,
                analysis: result.content,
                analysisType: 'comprehensive_legal_analysis',
                documentType: documentType,
                timestamp: new Date().toISOString(),
                wordCount: text.split(/\s+/).length,
                analysisLength: result.content.split(/\s+/).length
            };

        } catch (error) {
            console.error('Error in legal analysis:', error);
            return {
                success: false,
                error: error.message,
                analysisType: 'comprehensive_legal_analysis'
            };
        }
    }    /**
     * Generate executive summary of legal document
     */
    async generateLegalSummary(text, documentType = 'contract') {
        try {            const summaryPrompt = `
You are a legal expert tasked with creating a concise, executive-level summary of a legal document.
Create a clear, comprehensive summary that a business executive could understand quickly.

Document Type: ${documentType}
Document Text:
${text}

Please provide a structured summary with the following sections:

# Executive Summary
- Brief overview of the document's purpose and scope
- Key parties involved and their roles

# Key Terms & Conditions
- Most important terms and conditions
- Financial obligations and payment terms
- Performance requirements and deadlines

# Critical Clauses
- Essential legal provisions
- Rights and responsibilities of each party
- Important restrictions or limitations

# Financial Implications
- Payment amounts, schedules, and methods
- Cost allocation and expense responsibilities
- Financial penalties or bonuses

# Risk Factors
- Main legal and business risks
- Liability limitations and indemnification
- Termination conditions and consequences

# Important Dates & Deadlines
- Contract duration and renewal terms
- Key milestone dates
- Notice periods and deadlines

# Recommendations
- Key points to negotiate or clarify
- Additional protections to consider
- Action items for implementation

Keep the summary concise but comprehensive, using bullet points and clear language.
Focus on business-critical information that decision-makers need to know.
Use clear headers (# and ##), bullet points (-), and **bold text** for emphasis.

**DISCLAIMER:** This summary is for informational purposes only and does not constitute legal advice.
`;

            const result = await this.model.invoke(summaryPrompt);

            return {
                success: true,
                summary: result.content,
                summaryType: 'executive_legal_summary',
                documentType: documentType,
                timestamp: new Date().toISOString(),
                originalWordCount: text.split(/\s+/).length,
                summaryWordCount: result.content.split(/\s+/).length,
                compressionRatio: Math.round((result.content.split(/\s+/).length / text.split(/\s+/).length) * 100)
            };

        } catch (error) {
            console.error('Error in summary generation:', error);
            return {
                success: false,
                error: error.message,
                summaryType: 'executive_legal_summary'
            };
        }
    }    /**
     * Generate quick bullet-point summary for rapid review
     */
    async generateQuickSummary(text, maxBullets = 8) {
        try {
            const quickSummaryPrompt = `
Create a concise bullet-point summary of this legal document.
Extract the ${maxBullets} most important points that someone needs to know.

Document Text:
${text}

Provide exactly ${maxBullets} bullet points covering:
- Who are the parties
- What is the main purpose/subject
- Key obligations and responsibilities
- Important terms (dates, amounts, conditions)
- Major rights and restrictions
- Critical deadlines or milestones
- Termination or cancellation terms
- Notable risks or concerns

Format as clear, actionable bullet points. Keep each point concise but informative.
Start each bullet point with a strong action word or key concept.
`;

            const result = await this.model.invoke(quickSummaryPrompt);

            return {
                success: true,
                quickSummary: result.content,
                summaryType: 'quick_bullet_summary',
                bulletCount: maxBullets,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error in quick summary generation:', error);
            return {
                success: false,
                error: error.message,
                summaryType: 'quick_bullet_summary'
            };
        }
    }    /**
     * Extract key entities and terms from legal document
     */
    async extractLegalEntities(text) {
        try {            const entityPrompt = `
Analyze this legal document and extract key entities, terms, and information.

Document Text:
${text}

Extract and categorize the following information using clear formatting:

# Parties and Entities
- Names of individuals, companies, organizations
- Roles and relationships of each party
- Legal status and jurisdiction

# Financial Terms
- Dollar amounts, fees, costs
- Payment schedules and methods
- Financial obligations and penalties

# Dates and Deadlines
- Contract dates, effective dates
- Deadlines, milestones, expiration dates
- Notice periods and renewal dates

# Legal Terms and Clauses
- Important legal concepts mentioned
- Specific clause types (indemnification, liability, etc.)
- Governing law and jurisdiction

# Contact Information
- Addresses, phone numbers, emails
- Legal representatives or agents
- Registered offices

# Key Definitions
- Defined terms and their meanings
- Technical or legal terminology
- Industry-specific terms

# Performance Obligations
- Deliverables and services
- Quality standards and specifications
- Performance milestones

Format the response with clear headers (#), bullet points (-), and **bold** text for important items.
Only include information that is explicitly mentioned in the document.
`;

            const result = await this.model.invoke(entityPrompt);

            return {
                success: true,
                entities: result.content,
                extractionType: 'legal_entity_extraction',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error in entity extraction:', error);
            return {
                success: false,
                error: error.message,
                extractionType: 'legal_entity_extraction'
            };
        }
    }
}

export default LegalAnalysisService;
