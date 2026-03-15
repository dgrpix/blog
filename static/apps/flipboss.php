<?php

// top of this file figures out the POST inputs to know which functions to call
// it's real short, it either shows the input form, or deals out some cards

$go = $_POST["Go"];
if (!$go) {
	$go = $_REQUEST["Go"]; 
}

if ($go == "KingsGo") {
  DealCards();
  exit;
}
else {
        header("Location: https://www.random.org/playing-cards/");
        die();
}

function DealCards() {

// legacy dictates that $input is a list of just the donkeys for the rest of the code
// but we wish to add the PSC lookup function to the array
// so we'll manage both here.

$spitecards = array ( '1.png' => 'Crunch',
//	              '5.png' => 'Un (inactive)',
	              '6.png' => 'David',
                      '7.png' => 'Dean',
		      '11.png' => 'Bex',
//                    '14.png' => 'Jason P (inactive)',
                      '15.png' => 'Snoop',
                      '16.png' => 'Jordan',
                      '17.png' => 'Tom',
                      '18.png' => 'Todd',
                      '19.png' => 'Travis',
                      '21.png' => 'Bugsy',
                      '22.png' => 'Rich',
                      '23.png' => 'DLow',
                      '24.png' => 'DLow',
                      '25.png' => 'CMorg',
                      '26.png' => 'Bob',
		      '27.png' => 'Erin',
		      '28.png' => 'Edson',
                      '35.png' => 'Scott',
                      '39.png' => 'Katie',
                      '40.png' => 'Sabyl',
		      '42.png' => 'Jeff',
//                    '43.png' => 'CMeck (inactive)',
		      '47.png' => 'Ron G',
//                    '48.png' => 'Dave O (inactive)',
//                    '53.png' => 'Dan G (inactive)',
                      '52.png' => 'Andrew' );

$donks = array ( 'Crunch', 'David', 'Dean', 'Sabyl', 'Bex', 'Snoop', 'Jordan', 'Tom',
                 'Todd', 'Travis', 'Bugsy', 'Rich', 'DLow', 'CMorg', 'Bob',
                 'Erin', 'Scott', 'Jeff', 'Ron G', 'Andrew', 'Ryan', 'Edson',
                 'James', 'Kenny', 'Katie', 'SLB' );

// randomize the list of donkeys, and count them
// GetRandomDonkeys expects the input string to be not an array but a post body
// this is the list elements separated by \n including after the last one

$input = '';

foreach ($donks as $donk) {
  $input = $input . $donk . "\r\n";
}

$random_donkeys = GetRandomDonkeys($input);

$num_players = count($random_donkeys);

// the captains are the first two random donkeys in the list

$captains = [];
$captains_count = array_push($captains, $random_donkeys[0], $random_donkeys[1]);

$teameven = [];
$teamodd = [];

// this is a touch arcane. here's how it works
// we decided that if the total number of players is odd, and you were the last donkey,
// you would get auto-included regardless of the team captain flip
// however, you would go first and have to win wire to wire
// so, the big three-way IF statement puts you on the list either way if:
//  - we have an actual list on entry AND
//  - we are actually on entry, AND
//  - the list has an odd number of entries (so the current backed-down index is even)
// then it continues down and does the evens/odds separation for the rest of the list

$index = $num_players;

$odddonkey = null;

while ($index) {
  $donkey = $random_donkeys[--$index];
  if ($index > 0 && $index + 1 == $num_players && $index % 2 == 0) {
    $odddonkey = $donkey;
    array_push($teameven, $donkey);
    array_push($teamodd, $donkey);
    continue;
  }
  if ($index % 2 == 0) {
    array_push($teamodd, $donkey);
  } else {
    array_push($teameven, $donkey);
  }
}


// now, we have three arrays of donkeys
// captains
// teamodd
// teameven

// lets go get some cards to go with those arrays of donkeys

$captains_cards = FlipSomeCards($captains_count);
$teamodd_cards = FlipSomeCards(count($teamodd));
$teameven_cards = FlipSomeCards(count($teameven));


// now we have donkeys, and cards, let's print that out

print "<html><head><title>flips are cool</title></head><body>\n";
print "\n<!-- copy all the lines between, but not including, this comment and the one near the bottom -->\n\n";

PrintFlip($captains, $captains_cards, $spitecards, $teamodd, $teameven, $odddonkey);
print "<br><br><br>\n";
PrintFlip($teamodd, $teamodd_cards, $spitecards);
print "<br><br><br>\n";
PrintFlip($teameven, $teameven_cards, $spitecards);

print "\n\n<!-- copy all the lines between, but not including, this comment and the one near the top -->";
print "\n\n</body></html>";

}

function PrintFlip($donkeys, $cards_values, $spitecards, $teamodd = [], $teameven = [], $odddonkey = null) {
  
// we need to print a header if we are passing in the teams

  if ($teamodd && $teameven) {
    $tableStyle = "style=\"border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; font-size: 11px;\"";
    $tdStyle = "style=\"border: 1px solid black; padding: 4px;\"";

    print "<table $tableStyle>\n";
    print "<tr><td $tdStyle>Team ";
    print $donkeys['0']->nodeValue;
    print "</td>";
    foreach($teamodd as $punter) {
      if ($punter->nodeValue != $donkeys['0']->nodeValue && $punter->nodeValue != $odddonkey->nodeValue) {
        print "<td $tdStyle>$punter->nodeValue</td>";
      }
    }
    print "</tr>\n";
    print "<tr><td $tdStyle>Team ";
    print $donkeys['1']->nodeValue;
    print "</td>";
    foreach($teameven as $punter) {
      if ($punter->nodeValue != $donkeys['1']->nodeValue && $punter->nodeValue != $odddonkey->nodeValue) {
        print "<td $tdStyle>$punter->nodeValue</td>";
      }
    }
    print "</tr>\n";
    if ($odddonkey) {
      print "<tr><td $tdStyle colspan='8'>...and our floater is: $odddonkey->nodeValue</td></tr>\n\n";
    }
    print "</table><br>\n";
  }

// this prints the lists

  $i = 0;
  foreach($donkeys as $donkey) {

// some magic here = look up if this is a PSC and if it is the current person's PSC
// $donkey->nodeValue contains the name of the donkey
// $cards_values[$i] contains a string that matches the keys in the $spitecards array

    $currentcard = $cards_values[$i];

    print "<span style=\"font-family: Arial, Helvetica, sans-serif; font-size: 11px;\"><br>";
    print "$donkey->nodeValue</span>\n";

// going to change this to build a URL to the image, go get it, and inline the bitmap
// this is to get around the moderation of inlined images on google groups

    $img_style = '  style="outline: 3px outset white; outline-offset: -3px;"';
    //$img_style = '';

    if (array_key_exists($cards_values[$i], $spitecards)) {
      if ($donkey->nodeValue == $spitecards[$currentcard]) {
      	$img_style = ' style="outline: 3px outset gold; outline-offset: -3px;"';
        //$img_style = ' style="border:3px outset gold;"';
      } else {
	      //$img_style = ' style="border:3px outset red;"';
	      $img_style = ' style="outline: 3px outset red; outline-offset: -3px;"';
	      print "<span style=\"font-family: Arial, Helvetica, sans-serif; font-size: 11px;\">";
	      print "&nbsp;(" . $spitecards[$currentcard] . ")</span>\n";

      } 
    } else {
      if ($currentcard == '33.png') { // 6c faux-bastardo, green
        //$img_style = ' style="border:3px outset green;"';
        $img_style = ' style="outline: 3px outset green; outline-offset: -3px;"';
      } elseif ($currentcard == '34.png') { // 6s bastardo, black
	//$img_style = ' style="border:3px outset black;"';
	$img_style = ' style="outline: 3px outset black; outline-offset: -3px;"';
      } elseif ($currentcard == '12.png') { // Qd degenerado blue
	//$img_style = ' style="border:3px outset blue;"';
	$img_style = ' style="outline: 3px outset blue; outline-offset: -3px;"';
      } 
    }

// let's go fetch the image now

    $img_url = 'http://random.org/playing-cards/' . $currentcard;

    //$img_data = file_get_contents($img_url);

    //$img_data_tag = ' ';

    //if ($img_data !== false) {
    //  $img_data_tag = ' width="72" height="96" src="data:image/png;base64,' . base64_encode($img_data) . '">';
    //}

    //$img_tag = '<br><img' . $img_style . $img_data_tag . '<br>';

    $img_tag = '<br><img' . $img_style . ' width="72" height="96" src="' . $img_url . '">';

    print $img_tag;
    print "\n";
    $i += 1;
  }
}

function GetRandomDonkeys($input) {
  $url2 = 'https://www.random.org/lists/';
  $data2 = array('list' => $input, 'format' => 'html', 'rnd' => 'new', 'count' => '1', 'submit' => 'Randomize');

  $options = array(
    'http' => array(
      'header' => "Content-type: application/x-www-form-urlencoded\r\n",
      'method' => 'POST',
      'content' => http_build_query($data2)
    )
  );

  $context = stream_context_create($options);
  $html2 = file_get_contents($url2, false, $context);

  // and at this point, html2 contains in it a list of randomized names in the last <li> array on the page

  // parsing the randomized names

  $dom = new DOMDocument();
  @$dom->loadHTML($html2);
  $t = $dom->getElementsByTagName('ol');

  return $t->item(0)->getElementsByTagName('li');

}

function FlipSomeCards($num_players) {

  $url1 = "https://www.random.org/playing-cards/?decks=1&spades=on&hearts=on&diamonds=on&clubs=on";
  $url1 .= "&aces=on&twos=on&threes=on&fours=on&fives=on&sixes=on&sevens=on&eights=on&nines=on";
  $url1 .= "&tens=on&jacks=on&queens=on&kings=on&bjoker=on&remaining=on&cards=";
  $url1 .= $num_players;

  $cardshtml=file_get_contents($url1);

  // at this point, the cardshtml variable contains an array of cards which are numerically indexed as follows
  // <img src="28.png" width="72" height="96" alt="Eight of Diamonds" title="Eight of Diamonds" /><!-- 27 -> 28 -->
  // <img src="15.png" width="72" height="96" alt="Jack of Hearts" title="Jack of Hearts" /><!-- 14 -> 15 -->

  // Ac is 1, As is 2, Ah is 3, Ad is 4, Kc is 5, Ks is 6 ... 49 is 2c, 50 is 2s, 51 is 2h, and 52 is 2d
  // don't ask me why, this is how they come from random.org - the black joker is 53

  // their full URLs are: https://www.random.org/playing-cards/51.png

  // lets get the images parsed out

  $dom = new DOMDocument();
  @$dom->loadHTML($cardshtml);
  foreach($dom->getElementsByTagName('img') as $node)
  {
    $cards_array[] = $node->getAttribute('src');
  }

  return array_values($cards_array);

}

?>

