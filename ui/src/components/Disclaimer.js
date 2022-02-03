import React from 'react'
import disclaimerIcon from '../assets/images/disclaimer-modal/disclaimer@2x.png'

export const Disclaimer = ({ onConfirmation }) => (
  <div className="disclaimer-alert">
    <div className="image-container">
      <img className="disclaimer-icon" src={disclaimerIcon} alt="disclaimer icon" />
    </div>
    <div className="alert-container">
      <span className="disclaimer-title">
        Welcome to the
        <br /> TokenBridge UI App Beta+
      </span>
      <p className="disclaimer-description">
        We’re launching our TokenBridge and our UI App on a beta-testing basis. While we’ve worked long and hard to
        develop the core features of the software, we expect that our users may detect bugs and other issues. Help us
        improve by posting any difficulties to our{' '}
        <a href="https://t.me/joinchat/33zRfYDqHEc2M2Fi" target="_blank" rel="noopener noreferrer">
          support page
        </a>
        .<br />
        <br />
        Use of this app and the TokenBridge is at your own risk. Users may experience unexpected delays, unexpected
        visual artifacts, unexpected loss of tokens or funds from improper app configuration, or other negative
        outcomes.
        <br />
        <br />
        By hitting the "continue" button, you are representing that you’ve read our{' '}
        <a
          href="#terms"
          rel="noopener noreferrer"
        > 
          Terms of Service
        </a>{' '}
        in full, and that you agree to be legally bound by them.
      </p>

      <div id="terms" class="modal-window">
        <div>
          <a href="" title="Close" class="modal-close">Close</a>
          <h1>Terms of Service</h1>
          <div class="content">
<p dir="ltr"><span>Last updated: December </span><span>22</span><span>, 2021</span></p>
<p dir="ltr"><span><br /></span><span>These Terms of Service (these &ldquo;</span><span class="bold">Terms</span><span>&rdquo;) govern your use of and access to the web interface available at </span><a href="https://multichain.to/"><span>https://multichain.to/</span></a><span>, including any subdomains (the &ldquo;</span><span class="bold">Interface</span><span>&rdquo;). The Interface is designed as a web-based user interface that allows access and use of the Network Bridges &ndash; autonomous blockchain software, in a user-friendly and efficient manner. The Interface is not the same as the Network Bridges and you can always interact with the Network Bridges directly bypassing the Interface.</span></p>
<p dir="ltr"><span>By accessing or using the Interface, connecting your Digital Wallet, as defined below, to the Interface, or by clicking the button &ldquo;I accept&rdquo; or respective check box in connection with or relating to these Terms, you acknowledge that you have read, accept without modifications and agree to be bound by these Terms, which form a legally binding agreement between you and Multichain Labs, as defined below. If you do not accept or agree to these Terms, you are not allowed to access or use the Interface and you must immediately discontinue any use thereof.</span></p>
<p dir="ltr"><span>If you are acting for or on behalf of an entity, you hereby represent and warrant that you are authorised to accept these Terms and enter into a binding agreement with Multichain Labs on such entity&rsquo;s behalf, and you accept these Terms on behalf of such entity and on your own behalf.</span></p>
<p dir="ltr"><span>Please read these Terms carefully as they affect your obligations and legal rights. Note that Sections&nbsp;19 and 20 contain the choice of law, binding arbitration provisions, and class action waiver. Please read and review Sections 15, 16, 17, and 18 carefully before using the Interface as the Sections provide for the limitation of liability, your obligations to indemnify the Indemnified Parties, and contain disclaimer of warranties with regard to the Interface.</span></p>
<ol start="1">
<li dir="ltr">
<p dir="ltr"><span>DEFINITIONS</span></p>
</li>
</ol>
<p dir="ltr"><span>In these Terms, unless the context requires otherwise, the terms shall have the following meaning:</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Affiliate</span><span>&rdquo; means a person controlling, controlled by, or under the same control with Multichain Labs.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Communications</span><span>&rdquo; means any communications, agreements, documents, receipts, notices, and disclosures related to or given under these Terms.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Digital Wallet</span><span>&rdquo; means a digital blockchain cryptographic wallet &mdash; a pair of private and public cryptographic keys that can be used to receive, store, and dispose of Virtual Assets.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Dispute</span><span>&rdquo; means any dispute, claim, suit, action, causes of action, demand, or proceeding.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Force Majeure</span><span>&rdquo; has the meaning provided in Section 15 of these Terms.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Indemnified Parties</span><span>&rdquo; means Multichain Labs, its Affiliates, their respective shareholders, directors, officers, employees, agents, advisors, contractors, and assignees.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Interface</span><span>&rdquo; has the meaning indicated in the preamble of these Terms.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">LCIA</span><span>&rdquo; means London Court of International Arbitration.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">License</span><span>&rdquo; means a limited, temporary, personal,</span><span>non-transferable, non-exclusive, revocable, non-sublicensable license (right) to access and use the Interface for its intended purpose on the terms set forth herein.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Multichain Labs</span><span>&rdquo;, &ldquo;</span><span class="bold">we</span><span>&rdquo;, &ldquo;</span><span class="bold">us</span><span>&rdquo; means Multichain Labs Ltd, a company established under the laws of the British Virgin Islands.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Network Bridges</span><span>&rdquo; means open-sourced autonomous smart-contract systems implemented on the blockchain network(s) that enable the transfer of Virtual Assets from one blockchain network to another through so-called &ldquo;wrapping&rdquo;.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Open-Source Licenses</span><span>&rdquo; means licenses under which open-source software, materials, components, and items are distributed.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Terms</span><span>&rdquo; means these Terms of Service.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Third-Party Content</span><span>&rdquo; means certain content, materials, items, information, etc., provided along with the Interface by third parties or produced from third-party sources, such as, for example, (i) promotional materials and advertisements, other third-party materials and data, (ii) third-party websites and resources, and links thereto, and (iii)&nbsp;any information produced or derived from third-party sources, including projections, assumptions, prices, commissions, gas fees, exchange rates and other rates, etc.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Third-Party Costs</span><span>&rdquo; means certain third-party fees, costs, and expenses that may arise when you use or interact with the Interface, including, for example, blockchain gas costs or fees charged by the Integrators or any other third parties.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Third-Party Services</span><span>&rdquo; means any software, services, items, or solutions, such as, websites, platforms, applications, plugins, wallets, blockchains, etc. provided or operated by third parties (i.e., not by us).</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">Virtual Assets</span><span>&rdquo; means funds or virtual assets, including cryptocurrencies and other cryptographic tokens, such as, for example, USDC, USDT, DAI, BTC, ETH, or wrapped versions thereof.</span></p>
<p dir="ltr"><span>&ldquo;</span><span class="bold">you</span><span>&rdquo;, &ldquo;</span><span class="bold">your</span><span>&rdquo; means you as a person accessing or using the Interface. If you act on behalf of an entity, &ldquo;your&rdquo; or &ldquo;you&rdquo; shall refer to both the entity on whose behalf an individual using the is acting, and to such individual.</span></p>
<ol start="2">
<li dir="ltr">
<p dir="ltr"><span>NETWORK BRIDGES AND INTERFACE</span></p>
</li>
</ol>
<p dir="ltr"><span>The Interface is a web-based user interface that enables you to interact with the Network Bridges in a user-friendly and efficient manner. It is further expressly acknowledged that we do not control, manage or operate the Network Bridges. For more details concerning the Network Bridges, please refer to the information and materials available </span><a href="https://github.com/Multichainer/tokenbridge"><span>here</span></a><span>, which information and materials are provided for the information purposes only, are not binding and do not form a part of these Terms.</span></p>
<p dir="ltr"><span>The Network Bridges are comprised of </span><span>open-source public</span><span> smart-contract systems deployed on various blockchain networks that</span><span> can be reviewed, verified, used and accessed by anyone.</span><span> Any person can use or interact with the Network Bridges through third-party interfaces or directly, bypassing any web-based interfaces (including the Interface). You should carefully review and assess the Network Bridges smart-contracts before you use them</span><span>and any such use shall be at your own risk. Accordingly, in no event shall Multichain Labs be held liable or responsible with respect to the&nbsp; use or operation of the Network Bridges,</span><span>or any transactions that you perform therethrough.</span></p>
<ol start="3">
<li dir="ltr">
<p dir="ltr"><span>DIGITAL WALLET</span></p>
</li>
</ol>
<p dir="ltr"><span>When using the Interface, you may connect your Digital Wallet through one of the compatible third-party software wallets, such as, for illustration purposes only, MetaMask or similar software. The Digital Wallets constitute Third-Party Services and we are not responsible for, do not endorse, shall not be held liable in connection with, and do not make any warranties, whether express or implied, as to the Digital Wallet used by you with the Interface or otherwise. When using third-party software digital wallets, you should review applicable terms and policies that govern your use of such software digital wallets.</span></p>
<p dir="ltr"><span>We never receive access to or control over your Digital Wallet or Virtual Assets held in such Digital Wallet. Therefore, you are solely responsible for securing your Digital Wallet and credentials thereto (including private key, seed phrase, password, etc.) You may disconnect your Digital Wallet from the Interface at any time.</span></p>
<ol start="4">
<li dir="ltr">
<p dir="ltr"><span>VIRTUAL ASSETS</span></p>
</li>
</ol>
<p dir="ltr"><span>You hereby warrant that any Virtual Asset that is sent to the Network Bridges via the Interface is either owned by you or you have any other legal ground to dispose of such Virtual Asset, and that such Virtual Assets have not been derived from any unlawful activities. You shall be solely responsible for any transactions and operations performed through the Interface, and shall assume all risks, consequences and implications of transacting in Virtual Assets both through Interface and otherwise.</span></p>
<p dir="ltr"><span>We do not receive access to or control over your Digital Wallet, and do not control, manage, hold, or custody any of your Virtual Assets. Further, we do not provide any custodial or similar services, custodial solutions or software, and do not act as your agent or representative. Accordingly, we will never be a party to any transaction carried out with Virtual Assets through the Interface or Network Bridges, and will not be responsible for the consequences or results of such transactions. We shall not be responsible for or in connection with any of the Virtual Assets, their use, functionality or value. For the purposes hereof, Virtual Assets are deemed Third-Party Services.</span></p>
<ol start="5">
<li dir="ltr">
<p dir="ltr"><span>TRANSACTIONS</span></p>
</li>
</ol>
<p dir="ltr"><span>Transactions carried out with the use of the Interface on the applicable blockchain networks are irreversible and final. You may not claim refunds or cancel transactions once they are processed by the respective blockchain network. You are solely responsible for any transactions carried out with the use of the Interface, including on the blockchain networks, and you will carefully appraise and assess the risks involved in every such transaction before it is made. Furthermore, you shall solely make all decisions with regard to your transactions, and shall be solely responsible for their consequences, including possible losses and damages.</span></p>
<ol start="6">
<li dir="ltr">
<p dir="ltr"><span>FEES AND ASSOCIATED COSTS</span></p>
</li>
</ol>
<p dir="ltr"><span>The Interface itself does not charge any fees. However, the Network Bridges, being an autonomous blockchain software, may from time to time impose and charge certain transaction fees. In addition, when you conduct transactions via blockchain networks, certain gas fees may arise. It is your obligation to review and assess such fees before transacting via the Network Bridges, and, for the purposes hereof, all such fees shall be deemed Third-Party Costs. It is always your decision whether to incur the fees.&nbsp;</span></p>
<p dir="ltr"><span>We are not responsible for any Third-Party Costs and shall not be in any way liable in relation thereto. Although we may choose to demonstrate the estimated Third-Party Costs to be incurred by you in connection with your transaction, we shall not be obliged to do so. If we demonstrate to you any applicable Third-Party Costs, you shall not rely on such information and you shall independently verify the applicable Third-Party Costs.</span></p>
<ol start="7">
<li dir="ltr">
<p dir="ltr"><span>ELIGIBILITY</span></p>
</li>
</ol>
<p dir="ltr"><span>To be eligible to access and use the Interface, you must (i) comply with these Terms, (ii) be able to form a legally binding agreement with Multichain Labs on terms herein set forth, and (iii) be at least 18 (eighteen) years of age, or of such higher age required to enter into a binding agreement with Multichain Labs on the terms set out herein according to the laws of the jurisdiction where you reside.</span></p>
<ol start="8">
<li dir="ltr">
<p dir="ltr"><span>&nbsp;</span><span>DISCLAIMERS</span></p>
</li>
</ol>
<p dir="ltr"><span>Multichain Labs shall not be responsible for or held liable in connection with any operation carried out by you, any other user or group of users in or with the use of the Network Bridges, including any transfer, delivery, use, or storing of the Virtual Assets. Multichain Labs shall not act as an intermediary in any transaction nor shall we be responsible for ensuring that any transaction made with the use of the Network Bridges or otherwise on any blockchain is actually completed or performed. Multichain Labs does not control or influence the transactions with the Virtual Assets, and therefore is unable to cancel, reverse, block, or freeze any transactions conducted by you within a blockchain. Multichain Labs only provide the Interface as a means to interact with the Network Bridges and their functionality.</span></p>
<p dir="ltr"><span>Multichain Labs is not your broker, fund manager, or any intermediary to any broker or fund manager. Neither the Interface or anything in these Terms shall be considered as broker and/or fund management services, or any intermediation services thereto.</span></p>
<p dir="ltr"><span>Neither the Interface nor Multichain Labs provides financial advisory, legal, regulatory, or tax services directly, indirectly, implicitly, or in any other manner, and you should not consider any content contained in these Terms to be a substitute for professional financial, legal, regulatory, tax, or other advice.</span></p>
<p dir="ltr"><span>Neither the Interface nor these Terms are intended to constitute an offer of securities or a solicitation for investment in securities in any jurisdiction, nor is it intended to constitute a prospectus or offer document of any type. We do not provide any opinion or any advice to purchase, sell, or otherwise transact with the Virtual Assets and the information contained herein shall not form the basis of, or be relied upon in connection with, any contract or investment decision. Please consult your own legal or financial advisor.</span></p>
<ol start="9">
<li dir="ltr">
<p dir="ltr"><span>WARRANTIES AND REPRESENTATIONS</span></p>
</li>
</ol>
<p dir="ltr"><span>You represent and warrant to Multichain Labs that:</span></p>
<ol class="roman">
<li dir="ltr">
<p dir="ltr"><span>you have sufficient understanding of the functionality, usage, storage, transmission mechanisms and intricacies associated with the Virtual Assets, Virtual Asset storage facilities, including Digital Wallets, distributed ledger technology, and blockchain-based software;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>any Digital Wallet used by you in connection with the Interface is either owned by you, or that you are validly authorised to carry out actions using such Digital Wallet;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>any Virtual Assets used by you in connection with the Interface are from legitimate sources and were lawfully acquired;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>you are not subject to any sanctions administered or enforced by any country, government or international authority nor are you resident or established (in the case of a corporate entity) in a country or territory that is subject to a country-wide or territory-wide sanction imposed by any country or government or international authority;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>you shall be solely responsible for all and any operations and transactions with the Virtual Assets carried out in connection with the Interface;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>you acknowledge and agree that Multichain Labs does not act as your agent or fiduciary, and that Multichain Labs does not control or custody your Virtual Assets in any manner;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>if you are acting for or on behalf of an entity, such entity is duly incorporated, registered, validly existing and in good standing under the applicable laws of the jurisdiction in which the entity is established, and in each jurisdiction where it conducts business;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>accessing and/or using the Interface is not unlawful or prohibited under the laws of your jurisdiction or under the laws of any other jurisdiction to which you may be subject, and your access to and use of the Interface shall be in full compliance with applicable laws;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>you will comply with any applicable tax obligations in your jurisdiction arising from your acquisition, storage, sale, or transfer of the Virtual Assets, or another use of the Interface. Multichain Labs at any time does not act as your tax or withholding agent for any purposes;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>you understand that purchasing, selling, and holding the Virtual Assets carries substantial risk as the prices may change rapidly, and that you should obtain appropriate professional advice before making any decision;&nbsp;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>you shall not make any decisions based solely on the information available in these Terms and shall conduct your own substantial research and analysis before making any decision;&nbsp;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>your use of the Interface is at your own risk, and that nothing contained in these Terms shall be deemed a guarantee or promise that you will receive any profit or benefit, or that any transaction via the Interface will be beneficial or suitable for you;&nbsp;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>all of the above representations and warranties are true, complete, accurate, and non-misleading for the whole period of your use of the Interface.</span></p>
</li>
</ol><ol start="10">
<li dir="ltr">
<p dir="ltr"><span>PROHIBITED USE</span></p>
</li>
</ol>
<p dir="ltr"><span>When accessing or using the Interface, or in connection with such access or use, you shall not conduct or participate in any of the following activities:</span></p>
<ol class="roman">
<li dir="ltr">
<p dir="ltr"><span>disrupting, interfering with, or inhibiting other users from using the Interface or Network Bridges, or carry out activities that could disable, impair, or harm the functioning of the Interface, Network Bridges, servers, or underlying software;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>using the Interface for any illegal purposes, including, but not limited to, terrorism financing or money laundering;&nbsp;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>circumventing or attempting to circumvent any access or functionality restrictions or limitations with respect to the Interface, using malware, harmful code or software, undertake hacker attack or similar activities;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>carrying out activities aimed at manipulating the market, Virtual Assets prices, spoofing, or wash trading;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>violating any rights of any third person;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>carrying out fraudulent activities, providing any false, inaccurate, or misleading information in order to unlawfully obtain the Virtual Assets or property of other users or third persons;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>carrying out any other unlawful activities, or activities that violate any applicable regulations, rules, orders, etc.</span></p>
</li>
</ol><ol start="11">
<li dir="ltr">
<p dir="ltr"><span>THIRD-PARTY CONTENT</span></p>
</li>
</ol>
<p dir="ltr"><span>In connection with your use of the Interface you may view or interact with the Third-Party Content. Multichain Labs is not responsible for and shall not be held liable in connection with, and does not make any warranties, whether express or implied, as to the Third-Party Content, does not endorse and is not responsible for such Third-Party Content, any information, materials, content, services or tools on or available through such Third-Party Content.</span></p>
<p dir="ltr"><span>You hereby affirm and acknowledge that your use of Third-Party Content is at your own risk. To the maximum extent permitted by the applicable law, in no event shall Multichain Labs be responsible for or held liable in connection with any loss or damage of any sort incurred by you as the result of, or in connection with accessing or using any Third-Party Content.</span></p>
<ol start="12">
<li dir="ltr">
<p dir="ltr"><span>LICENSE</span></p>
</li>
</ol>
<p dir="ltr"><span>Subject to your continued compliance with the eligibility requirements set out in Section 7 of these Terms, we hereby grant you the License. The License is subject to other terms and conditions provided in these Terms and will remain effective until terminated as provided herein. Any open-source software, components and items will not be covered by the License granted hereunder, and will be subject to the terms and conditions of the applicable Open-Source Licenses.</span></p>
<p dir="ltr"><span>The License granted hereunder shall terminate and cease upon the occurrence of any of the following events: (i) these Terms expire or are terminated; (ii) you violate these Terms; (iii) we choose to terminate the License or your access to the Interface at its sole and absolute discretion, with or without reason.&nbsp;</span></p>
<p dir="ltr"><span>Your access and use of the Interface shall not violate the terms of the License and/or Open-Source Licenses, if and as applicable.</span></p>
<ol start="13">
<li dir="ltr">
<p dir="ltr"><span>UPDATES</span></p>
</li>
</ol>
<p dir="ltr"><span>Multichain Labs may from time to time and without prior notice make certain updates, improvements, or modifications to the Interface, including, but not limited to, updates to the underlying software, infrastructure, security protocols, technical configurations, functionality, financial structure, or service features, and Multichain Labs shall not be in any case held liable with respect to any such update. In such cases the Interface may be unavailable.</span></p>
<ol start="14">
<li dir="ltr">
<p dir="ltr"><span>AVAILABILITY AND ACCESS</span></p>
</li>
</ol>
<p dir="ltr"><span>Availability and functionality of the Interface depend on various factors, including the proper functioning of the Network Bridges and applicable blockchain networks. We do not warrant or guarantee that the Interface will operate and/or be available at all times without disruption or interruption, or that it will be immune from unauthorised access, bug-, virus-, or error-free.</span></p>
<p dir="ltr"><span>The Interface may be inaccessible or inoperable from time to time for any reason, including, for example, equipment malfunctions, maintenance procedures or repairs, force majeure circumstances, disruptions, and temporary or permanent unavailability of the Network Bridges or underlying blockchain infrastructure, and/or unavailability of respective third-party service providers or Integrators. In the aforementioned cases, the access or use of the Interface may be prevented or limited. Furthermore, there is no guarantee that the Interface will be available for access and use in the future.</span></p>
<ol start="15">
<li dir="ltr">
<p dir="ltr"><span>LIMITATION OF LIABILITY</span></p>
</li>
</ol>
<p dir="ltr"><span>To the maximum extent permitted under the applicable law and with the exception to unlawful intent, gross negligence, wilful misconduct, or fraud, in no event and under no circumstances shall:</span></p>
<ol class="roman">
<li dir="ltr">
<p dir="ltr"><span>Indemnified Parties be liable for any indirect, special, punitive, exemplary, incidental, or consequential damages of any kind, nor shall they be liable for the loss of goodwill, loss of profits (including expected), loss of data, diminution of value, and business interruption arising out of or in connection with these Terms or their violation, the use or inability to use the Interface and/or the failure of the Interface to perform as expected, whether based upon breach of warranty or contract, negligence, strict liability, tort, or any other legal theory, regardless of whether Indemnified Parties have been advised of the possibility of such damages;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>officers, directors, employees, consultants, and shareholders of Indemnified Parties be held personally liable in connection with these Terms or their violation, or the use or inability to use the Interface;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>Indemnified Parties be liable for any damages or losses arising in connection with a hacker attack, phishing attack, viruses, or trojan horses, whether transmitted via the Interface or otherwise, or any other unauthorised third-party intervention in the operation of the Interface;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>any Indemnified Party be liable for any non-performance or undue performance of its obligations hereunder if such non-performance or undue performance results from or is caused, directly or indirectly, by the Force Majeure circumstances. Force majeure circumstances (the &ldquo;</span><span class="bold">Force Majeure</span><span>&rdquo;) include, without limitation, (i) fire, flood, hostility, pandemic, the act of God, explosion, strike, (ii) war, undeclared war, civil war, revolution, riot, act of terrorism, military actions and operations, (iii) epidemic, pandemic, insurrection, riot, labour dispute, accident, (iv) sanctions, government actions, embargoes, (v) injunctions, cease and desist orders, restraining or similar orders, other actions of a court, governmental or other authorities, (vi) weaknesses, vulnerabilities and bugs in the software, blockchain networks, smart-contracts, other technologies used in connection with the Interface, 51% attacks or similar attacks on Virtual Assets&rsquo; underlying blockchain networks; (vii) theft of Virtual Assets, including from the smart-contracts or accounts with digital asset (cryptocurrency) exchanges, loss or theft of Virtual Assets as a result of an attack, including hacker, malware, or other attack, or third-party hostile interference; (viii) actions, failures to act or inactions of Third-Party Service providers or other third parties, including fraud or theft of funds by controlled by such third parties (including so-called &ldquo;exit-scam&rdquo;), (ix) system interference and/or destruction by any malicious programs, (x) power failure, equipment or software malfunction or error, (xi) other circumstances beyond our control interfering the performance hereof;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>Indemnified Parties be responsible or held liable with respect to the Network Bridges, Third-Party Services, Third-Party Costs, or Third-Party Content;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>the aggregate liability of Indemnified Parties to you for all damages and losses whatsoever arising out of or in connection with these Terms, their undue performance or violation, use or inability to use the Interface shall be limited to US&nbsp;$1,000 (one thousand U.S. dollars).</span></p>
</li>
</ol>
<p dir="ltr"><span>You shall not, and to the maximum extent permitted under the law hereby waive any right to, seek to recover the damages listed above in this Section 15 from Indemnified Parties and/or persons specified above. Inasmuch as some jurisdictions do not allow the exclusions or limitations as set forth herein, the above exclusions and limitations shall apply to the maximum extent permitted by the applicable law.</span></p>
<ol start="16">
<li dir="ltr">
<p dir="ltr"><span>INDEMNIFICATION</span></p>
</li>
</ol>
<p dir="ltr"><span>To the fullest extent permitted under the applicable law, you shall indemnify, defend, and hold harmless Indemnified Parties from and against any and all claims, demands, actions, damages, losses, costs, and expenses (including reasonable professional and legal fees) that arise from or relate to (i) your violation of these Terms, including making untrue or false representations or warranties, (ii) your access to or use of the Interface, and (iii) exercising, enforcing, or preserving our rights, powers or remedies (or considering doing so) with respect to you in connection with these Terms.</span></p>
<p dir="ltr"><span>We reserve the right to exercise sole control over the defence, at your sole cost and expense, of any claim subject to an indemnity set out in this Section 16. The indemnity set out in this Section 16 is in addition to, and not in lieu of, any other remedies that may be available to us under the applicable law.</span></p>
<ol start="17">
<li dir="ltr">
<p dir="ltr"><span>NO WARRANTY</span></p>
</li>
</ol>
<p dir="ltr"><span>The Interface is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, and your use of the Interface will always be at your own risk. We make no warranty of any kind, express or implied, including, but not limited to, the implied warranties of title, non-infringement, integration, merchantability, and fitness for a particular purpose, and any warranties implied by any course of performance or usage of trade, with respect to the Interface, all of which are expressly disclaimed.&nbsp;</span></p>
<p dir="ltr"><span>We do not warrant, whether expressly or impliedly, and expressly disclaim any warranty and/or representation that:&nbsp;</span></p>
<ol class="roman">
<li dir="ltr">
<p dir="ltr"><span>the Interface will work as expected;&nbsp;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>the Interface will be secure or available at any particular time or place, or will continue working, operating or functioning for any period of time;&nbsp;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>any defects, flaws, bugs or errors in the Interface will be corrected; or&nbsp;</span></p>
</li>
<li dir="ltr">
<p dir="ltr"><span>the Interface will be free of viruses, bugs, trojan horses, malfunctions, or other harmful components, or properly protected from hacker- or malware attacks.</span></p>
</li>
</ol><ol start="18">
<li dir="ltr">
<p dir="ltr"><span>WAIVER OF FIDUCIARY DUTIES</span></p>
</li>
</ol>
<p dir="ltr"><span>The Interface and these Terms are not intended to create or impose any fiduciary duty on us with respect to you. Notwithstanding anything to the contrary contained in these Terms or applicable provision of law or equity, to the maximum extent permitted by the applicable law, we shall owe no fiduciary duties to you.</span></p>
<ol start="19">
<li dir="ltr">
<p dir="ltr"><span>APPLICABLE LAW&nbsp;</span></p>
</li>
</ol>
<p dir="ltr"><span>These Terms, as well as any and all relationship between you and us relating to the Interface, shall be governed by and construed and enforced in accordance with the laws of England and Wales, without regard to conflict of law rules or principles that would cause the application of the laws of any other jurisdiction. The United Nations Convention on Contracts for the International Sale of Goods shall not apply to these Terms.</span></p>
<ol start="20">
<li dir="ltr">
<p dir="ltr"><span>DISPUTES RESOLUTION</span></p>
</li>
</ol>
<p dir="ltr"><span>Except for any Disputes in which either party seeks injunctive or other equitable relief for the alleged unlawful use of intellectual property, including, without limitation, copyrights, trademarks, trade names, logos, trade secrets or patents, you and Multichain Labs hereby agree to settle and finally resolve any Dispute arising out of or in connection with these Terms or the Interface in binding arbitration and in accordance with this Section&nbsp;20. Binding arbitration is the referral of a Dispute to a qualified person(s) who will review the Dispute and make a final and binding determination, by making an order, to resolve the Dispute.</span></p>
<p dir="ltr"><span>For any Dispute that you have against Multichain Labs or relating in any way to these Terms or the Interface, you shall first contact us and attempt to resolve the Dispute informally by sending a notice to Multichain Labs by email at </span><a href="mailto:multichainlab@gmail.com"><span>multichainlab@gmail.com</span></a><span>. The notice must include your name, residence address, email address, and telephone number, describe the nature and basis of the Dispute and set forth the specific relief sought. If Multichain Labs and you cannot reach an agreement to resolve the Dispute within thirty (30) days after such notice is received, then either party may submit the dispute to binding arbitration administered by the LCIA, in accordance with the terms set forth below.&nbsp;</span></p>
<p dir="ltr"><span>Any Disputes arising out of or in connection with these Terms or the Interface, including any question regarding the existence, validity, or termination of these Terms, shall be referred to and finally resolved by the binding arbitration under the LCIA rules, which rules are deemed to be incorporated by reference herein. Any arbitration will occur in London, UK. You will not and hereby waive your rights to object to the arbitration prescribed herein.</span></p>
<p dir="ltr"><span>Unless otherwise required by the applicable law, and to the maximum extent permitted and possible, you, Multichain Labs, and the arbitrators shall maintain the confidentiality of any arbitration proceedings, judgments and awards, including, but not limited to, all information gathered, prepared and presented for purposes of the arbitration or related to the Disputes. Unless prohibited under the law, the arbitrator will have the authority to make appropriate rulings to safeguard confidentiality.&nbsp;</span></p>
<p dir="ltr"><span>Any Dispute arising out of or related to these Terms is personal to you and Multichain Labs and will be resolved solely through individual arbitration and will not be brought as a class arbitration, class action, or any other type of representative proceeding in any circumstances. There will be no class or other type or representative action, whether within or outside of arbitration where an individual attempts to resolve a Dispute as a representative of another individual or group of individuals.&nbsp;</span></p>
<p dir="ltr"><span>To the maximum extent permitted under the law, you and Multichain Labs waive the rights to a jury trial, class action arbitration, and to have any Dispute resolved in court.</span></p>
<p dir="ltr"><span>To the maximum extent permitted under the law, you and Multichain Labs hereby agree that any claim arising out of or related to these Terms or the Interface shall be filed within one (1) year after the ground for such claim arose; if the claim is not filed within this term, such claim shall be permanently barred, which means that neither you, nor Multichain Labs will have the right to assert such claim.</span></p>
<ol start="21">
<li dir="ltr">
<p dir="ltr"><span>NO WAIVER</span></p>
</li>
</ol>
<p dir="ltr"><span>No failure or delay by Multichain Labs to exercise any right or remedy provided under these Terms or by law shall constitute a waiver of that or any other right or remedy, nor shall it preclude or restrict the further exercise of that or any other right or remedy. No single or partial exercise of such right or remedy shall preclude or restrict the further exercise of that or any other right or remedy.</span></p>
<ol start="22">
<li dir="ltr">
<p dir="ltr"><span>ENTIRE AGREEMENT</span></p>
</li>
</ol>
<p dir="ltr"><span>These Terms, together with any documents incorporated herein by reference, contain the entire agreement between you and us, and supersede all prior and contemporaneous understandings, writings, letters, statements or promises between you and us regarding the subject matters hereof. Unless otherwise expressly provided herein, there shall be no third-party beneficiaries hereto.</span></p>
<ol start="23">
<li dir="ltr">
<p dir="ltr"><span>PERSONAL DATA</span></p>
</li>
</ol>
<p dir="ltr"><span>In order to enable you to use certain functionality of the Interface, we process the public blockchain address of your Digital Wallet, which you provide us when you connect your Digital Wallet to the Interface. In addition, to verify that the initiated transaction is properly conducted, we may process the information regarding the transactions initiated with the respective Digital Wallet.</span></p>
<p dir="ltr"><span>While processing the above information, we cannot identify a person as an individual. Please note that we do not combine such data with certain other data concerning the individual. We will update these Terms and provide you with the appropriate privacy information once and if we are able to identify particular individuals.</span></p>
<p dir="ltr"><span>Please kindly note that the above information is used within a decentralised blockchain network: essentially, you enter this data to a blockchain using your digital wallet each time you make a blockchain transaction or interact with blockchain smart-contracts via the Interface. We do not control nor operate blockchain networks. This means that due to the structure of the blockchain network certain rights or abilities may be limited and we may not be able to influence your data on the blockchain. It also means that the above information is publicly available to any person who has access to the blockchain. Please be aware that any transaction within the blockchain network is irreversible and information put into the blockchain cannot be deleted or changed. If you do not agree with your data being processed on a blockchain network, you should not transact on blockchains and use the blockchain-related products, such as Interface.</span></p>
<p dir="ltr"><span>As we cannot identify you as an individual, you cannot exercise your data subject&rsquo;s rights, unless you provide us with additional information confirming that the data processed by us is genuinely related to you. For this reason, we may also request you to conduct certain actions (such as to conduct a blockchain transaction) to verify your identity and confirm that you have the right to exercise the data subject&rsquo;s rights. For the avoidance of doubt, you cannot enforce your data subject&rsquo;s rights with respect to the information you provide to us unless we are sure that such information is associated with you. Please note that due to the nature of decentralised blockchains, certain data protection rights may be limited.</span></p>
<ol start="24">
<li dir="ltr">
<p dir="ltr"><span>SURVIVAL</span></p>
</li>
</ol>
<p dir="ltr"><span>Sections 8, 13-30 shall survive any expiration or termination of these Terms or your access to or use of the Interface, regardless of the reasons.</span></p>
<ol start="25">
<li dir="ltr">
<p dir="ltr"><span>ASSIGNABILITY</span></p>
</li>
</ol>
<p dir="ltr"><span>You shall not have the right to assign or transfer any rights or obligations under these Terms without our prior written consent. We may assign and transfer these Terms, all and any rights and obligations hereunder to our Affiliate or successor, without your consent or approval, or any prior notice.</span></p>
<ol start="26">
<li dir="ltr">
<p dir="ltr"><span>MODIFICATION</span></p>
</li>
</ol>
<p dir="ltr"><span>We may modify, supplement or update these Terms from time to time at our sole discretion. If we make changes to these Terms, we will provide you with notice of such changes by providing a notice via the Interface and/or by updating the &ldquo;Last Updated&rdquo; date at the top of these Terms. Unless otherwise specified in our notice, updated Terms shall be effective immediately, and your continued use of the Interface will confirm the acceptance of such updated Terms. If you do not agree to any amended Terms, you must immediately discontinue any access to or use of the Interface.</span></p>
<ol start="27">
<li dir="ltr">
<p dir="ltr"><span>VALIDITY AND ENFORCEABILITY</span></p>
</li>
</ol>
<p dir="ltr"><span>The invalidity or unenforceability of any provision or part-provision of these Terms shall not affect the validity or enforceability of any other provisions of these Terms, all of which shall remain in full force and effect.</span></p>
<ol start="28">
<li dir="ltr">
<p dir="ltr"><span>INTERPRETATION</span></p>
</li>
</ol>
<p dir="ltr"><span>Unless the context otherwise requires, a reference to one gender shall include a reference to the other genders; words in the singular shall include the plural and in the plural shall include the singular; any words following the terms including, include, in particular, for example or any similar expression shall be construed as illustrative and shall not limit the sense of the words, description, definition, phrase or term preceding those terms; Section headings do not affect the interpretation of these Terms. You hereby agree that a rule of construction does not apply to the disadvantage of Multichain Labs because it was responsible for the preparation of these Terms.</span></p>
<ol start="29">
<li dir="ltr">
<p dir="ltr"><span>LANGUAGE</span></p>
</li>
</ol>
<p dir="ltr"><span>Currently, only the English version of any Communications is considered official. The English version shall prevail in case of differences in translation of any documents, Communications or other content.</span></p>
<ol start="30">
<li dir="ltr">
<p dir="ltr"><span>&nbsp;COMMUNICATIONS</span></p>
</li>
</ol>
<p dir="ltr"><span>You agree and consent to receive electronically all Communications that we provide in connection with these Terms and any matters contemplated herein. You agree that we may provide Communications to you by posting them within the Interface. If you provide us your email address, we may (but will not be obliged to) send Communications to you by email. It is your responsibility to regularly monitor the above communication channels for updates. All Communications given in accordance with this paragraph shall be deemed in writing, valid and of full legal force, and delivered to you on the day following the day when they are published or transmitted, as the case may be. You may electronically communicate with us by sending Communications to the following email address: </span><a href="mailto:multichainlab@gmail.com"><span>multichainlab@gmail.com</span></a><span>. We may require you to provide additional data or documents that will allow us to identify you and properly assess your inquiry.</span></p>


          </div>
        </div>
      </div>

      <div className="disclaimer-buttons">
        <button className="disclaimer-confirm" onClick={onConfirmation}>
          Continue
        </button>
      </div>
    </div>
  </div>
)
